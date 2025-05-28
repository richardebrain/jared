import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Gamepad2, 
  ImageIcon, 
  Brain, 
  Headphones, 
  Drama,
  Sparkles,
  ArrowLeft,
  Save,
  Play,
  Clock,
  Award
} from "lucide-react";

// Module template types
const MODULE_TEMPLATES = [
  {
    id: "mini-video",
    title: "🎥 Mini Video Lessons",
    duration: "2-5 minutes",
    description: "Energetic, visual lessons with clear voiceovers. Perfect for 'How to Guide a Meltdown' or 'Positive Redirection Tips'",
    icon: Video,
    color: "bg-blue-50 border-blue-200",
    features: ["One concept per video", "Add bloopers for humor", "Classroom clips", "Clear voiceovers"]
  },
  {
    id: "interactive-scenario", 
    title: "🎮 Interactive Scenarios",
    duration: "3-7 minutes",
    description: "Choose-Your-Own-Adventure style learning. Like 'Jayden's Having a Rough Morning—What Do You Do?'",
    icon: Gamepad2,
    color: "bg-green-50 border-green-200",
    features: ["Multiple choice paths", "See consequences", "Real scenarios", "Interactive outcomes"]
  },
  {
    id: "visual-storyboard",
    title: "📸 Visual Storyboards", 
    duration: "1-3 minutes",
    description: "4-6 illustrated steps with captions or GIFs showing best practices",
    icon: ImageIcon,
    color: "bg-purple-50 border-purple-200",
    features: ["Step-by-step visuals", "GIF animations", "Quick reference", "Visual learning"]
  },
  {
    id: "quiz-teachback",
    title: "🧩 Quick Quiz + Teachback",
    duration: "2-4 minutes", 
    description: "3-question quiz with auto-feedback and 'why it matters' explanation",
    icon: Brain,
    color: "bg-orange-50 border-orange-200",
    features: ["Auto-feedback", "Badge rewards", "Knowledge check", "Bite-sized learning"]
  },
  {
    id: "audio-nugget",
    title: "🎙️ Podcast-Style Audio",
    duration: "3-8 minutes",
    description: "Perfect for commuting or classroom prep. 'In 5 Minutes: What Trauma-Informed Really Means'",
    icon: Headphones,
    color: "bg-pink-50 border-pink-200", 
    features: ["Voice variety", "On-the-go learning", "Expert interviews", "Story format"]
  },
  {
    id: "roleplay-reel",
    title: "🎭 Roleplay Reels",
    duration: "2-6 minutes",
    description: "Short skits showing 'What Not to Do' vs 'What to Try Instead' with voting",
    icon: Drama,
    color: "bg-yellow-50 border-yellow-200",
    features: ["Before/after scenarios", "Teacher voting", "Real situations", "Engaging skits"]
  }
];

interface ModuleCreatorProps {}

export default function ModuleCreator({}: ModuleCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [moduleData, setModuleData] = useState({
    title: "",
    description: "",
    category: "",
    pointValue: 10,
    targetAudience: "All Teachers"
  });

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const generateContentWithAI = async () => {
    setIsGeneratingContent(true);
    // Simulate AI generation - we'll connect to the actual AI later
    setTimeout(() => {
      setIsGeneratingContent(false);
    }, 2000);
  };

  const saveModule = () => {
    // Save module logic here
    console.log("Saving module:", { selectedTemplate, moduleData });
  };

  if (selectedTemplate) {
    const template = MODULE_TEMPLATES.find(t => t.id === selectedTemplate);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTemplate(null)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Templates</span>
          </Button>
          <div className="flex items-center space-x-2">
            <template!.icon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">{template!.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Setup */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Module Title</label>
                  <Input
                    placeholder="e.g., How to Guide a Meltdown with Compassion"
                    value={moduleData.title}
                    onChange={(e) => setModuleData({...moduleData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Brief description of what teachers will learn..."
                    rows={3}
                    value={moduleData.description}
                    onChange={(e) => setModuleData({...moduleData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Input
                      placeholder="e.g., Behavior Management"
                      value={moduleData.category}
                      onChange={(e) => setModuleData({...moduleData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Point Value</label>
                    <Input
                      type="number"
                      value={moduleData.pointValue}
                      onChange={(e) => setModuleData({...moduleData, pointValue: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template-Specific Content Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>AI Content Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Our AI will help you create engaging {template!.title.toLowerCase()} content based on your topic.
                  </p>
                  
                  <Button 
                    onClick={generateContentWithAI}
                    disabled={!moduleData.title || isGeneratingContent}
                    className="w-full"
                  >
                    {isGeneratingContent ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {template!.title} Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Info & Preview */}
          <div className="space-y-6">
            <Card className={template!.color}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <template!.icon className="h-5 w-5" />
                  <span>Template Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{template!.duration}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">{template!.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Includes:</p>
                    {template!.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Preview Module
                </Button>
                
                <Button onClick={saveModule} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Module
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Create Engaging Training Modules</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose from six proven template formats to create professional development content that your teachers will love.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULE_TEMPLATES.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${template.color} hover:scale-105`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <template.icon className="h-8 w-8" />
                <div>
                  <div className="text-lg">{template.title}</div>
                  <div className="text-sm font-normal text-gray-500 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{template.duration}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 mb-4">{template.description}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Perfect for:</p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Select Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Professional Results, Easy Creation</h3>
        <p className="text-gray-600 max-w-xl mx-auto">
          Each template includes built-in AI assistance, engagement features, and proven educational design patterns 
          to help you create modules that teachers actually want to complete.
        </p>
      </div>
    </div>
  );
}