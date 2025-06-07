import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { ArrowLeft, Brain, Sparkles, Wrench, BookOpen } from "lucide-react";
import MicroLearningTemplateSelector from "@/components/MicroLearningTemplateSelector";
import AIModuleDesigner from "@/components/AIModuleDesigner";

export default function EnhancedModuleBuilder() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'overview' | 'templates' | 'ai-designer' | 'custom'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    // Navigate to comprehensive module creator with template data
    setLocation('/comprehensive-module-creator?template=' + encodeURIComponent(JSON.stringify(template)));
  };

  const handleAIModuleComplete = (moduleData: any) => {
    // Navigate to comprehensive module creator with AI-generated data
    setLocation('/comprehensive-module-creator?ai-generated=' + encodeURIComponent(JSON.stringify(moduleData)));
  };

  const handleCustomModule = () => {
    // Navigate to comprehensive module creator without pre-filled data
    setLocation('/comprehensive-module-creator');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Build Engaging Learning Modules</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Create effective micro-learning experiences with proven templates, AI assistance, or build completely custom modules. 
          Choose the approach that best fits your content and audience.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50 group" onClick={() => setCurrentView('templates')}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Proven Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start with research-based templates that follow micro-learning best practices. Perfect for common training topics.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Pre-designed activity sequences</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Varied engagement methods</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Built-in assessments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>5-25 minute modules</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50 group" onClick={() => setCurrentView('ai-designer')}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Brain className="h-6 w-6" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">AI-Powered Design</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Let AI guide you through creating a custom module. Describe your goals and get a tailored learning design.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Step-by-step guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Personalized to your audience</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Adaptive difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Optimized activity mix</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50 group" onClick={() => setCurrentView('custom')}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <Wrench className="h-6 w-6" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Custom Builder</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Build from scratch with complete control over every aspect. Perfect for unique topics or specialized requirements.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Full creative control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Any duration or format</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Custom activity types</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Advanced features</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={() => setLocation('/admin-modules')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Module Management
        </Button>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'templates':
        return (
          <MicroLearningTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onCustomModule={() => setCurrentView('custom')}
          />
        );
      case 'ai-designer':
        return (
          <AIModuleDesigner
            onModuleComplete={handleAIModuleComplete}
            onBack={() => setCurrentView('overview')}
          />
        );
      case 'custom':
        handleCustomModule();
        return null;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {currentView !== 'overview' && currentView !== 'ai-designer' && (
        <div className="mb-6">
          <Button variant="outline" onClick={() => setCurrentView('overview')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module Builder
          </Button>
        </div>
      )}
      
      {renderCurrentView()}
    </div>
  );
}