import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Camera, 
  Users, 
  Brain, 
  Star, 
  ArrowRight,
  Sparkles,
  Mic,
  ImageIcon,
  CheckCircle
} from 'lucide-react';

interface PortfolioBuilderWelcomeProps {
  hasChildren: boolean;
  childrenCount: number;
  hasReferencePhotos: boolean;
}

export default function PortfolioBuilderWelcome({ 
  hasChildren, 
  childrenCount, 
  hasReferencePhotos 
}: PortfolioBuilderWelcomeProps) {
  const setupSteps = [
    {
      id: 'add-children',
      title: 'Add Children to Your Class',
      description: 'Create profiles for each child in your class',
      icon: Users,
      href: '/portfolio-builder',
      completed: hasChildren,
      count: childrenCount
    },
    {
      id: 'add-photos',
      title: 'Add Reference Photos',
      description: 'Upload clear photos of each child for facial recognition',
      icon: ImageIcon,
      href: '/portfolio-builder',
      completed: hasReferencePhotos,
      count: hasReferencePhotos ? childrenCount : 0
    },
    {
      id: 'start-capturing',
      title: 'Start Capturing Learning Moments',
      description: 'Use AI-powered photo analysis to create portfolios',
      icon: Camera,
      href: '/portfolio-builder',
      completed: hasChildren && hasReferencePhotos,
      count: 0
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const totalSteps = setupSteps.length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Portfolio Builder!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create comprehensive learning portfolios with AI-powered photo analysis and voice notes.
          </CardDescription>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                Setup Progress: {completedSteps}/{totalSteps}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {Math.round((completedSteps / totalSteps) * 100)}% Complete
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Getting Started Checklist</h3>
        {setupSteps.map((step) => (
          <Card 
            key={step.id}
            className={`transition-all ${
              step.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200 hover:border-primary/30'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  step.completed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    {step.count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {step.count} {step.id === 'add-children' ? 'children' : 'photos'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                {step.completed ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Done
                  </Badge>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={step.href}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How Portfolio Builder Works
          </CardTitle>
          <CardDescription>
            Learn how to use AI-powered features to create comprehensive learning portfolios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium">1. Capture Photos</h4>
              <p className="text-sm text-gray-600">
                Take photos of learning moments using your device camera or upload from gallery
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium">2. AI Analysis</h4>
              <p className="text-sm text-gray-600">
                AI automatically detects children, activities, emotions, and learning indicators
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium">3. Add Voice Notes</h4>
              <p className="text-sm text-gray-600">
                Record voice notes to provide context and observations about the learning moment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Facial recognition for automatic child identification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">AI-powered activity and emotion detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Voice note recording and transcription</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">NAEYC standards alignment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Learning milestone tracking</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Smart Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Automatic portfolio entry creation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Intelligent child assignment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Learning activity classification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Emotional state analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Professional development insights</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Button */}
      <div className="text-center">
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90"
          asChild
        >
          <Link href="/portfolio-builder">
            <Camera className="w-5 h-5 mr-2" />
            Start Building Portfolios
          </Link>
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Ready to capture learning moments? Click above to get started!
        </p>
      </div>
    </div>
  );
} 