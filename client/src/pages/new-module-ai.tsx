import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Wand2,
  Loader2,
  Zap,
  BookOpen,
  Brain,
  Wrench,
  Users,
  Edit,
  Type,
  FileText,
  Save,
  Plus,
  RefreshCw,
  Clock,
  Search,
} from "lucide-react";
import QuizSectionBuilder from "@/components/SectionBuilders/QuizSectionBuilder";
import MatchingSectionBuilder from "@/components/SectionBuilders/MatchingSectionBuilder";
import ScenarioMatchSectionBuilder from "@/components/SectionBuilders/ScenarioMatchSectionBuilder";
import VideoSectionBuilder from "@/components/SectionBuilders/VideoSectionBuilder";
import TextSectionBuilder from "@/components/SectionBuilders/TextSectionBuilder";

// Proven Templates - The foundation for AI-driven content creation
const PROVEN_TEMPLATES = [
  {
    id: "lightning",
    title: "Lightning Module",
    description: "Quick 10-15 minute focused learning for busy teachers",
    duration: "15 min",
    icon: Zap,
    color: "border-yellow-200 bg-yellow-50",
    sections: [
      { title: "Quick Introduction", type: "text", duration: 3 },
      { title: "Core Concept", type: "example", duration: 5 },
      { title: "Practical Application", type: "scenario", duration: 4 },
      { title: "Quick Check", type: "quiz", duration: 3 },
    ],
  },
  {
    id: "standard",
    title: "Standard Module",
    description: "Comprehensive 20-30 minute learning experience",
    duration: "25 min",
    icon: BookOpen,
    color: "border-blue-200 bg-blue-50",
    sections: [
      { title: "Welcome & Objectives", type: "text", duration: 3 },
      { type: "video", title: "Video or Case Story", duration: 3 },
      { title: "Foundation Knowledge", type: "text", duration: 8 },
      { title: "Real-World Examples", type: "example", duration: 6 },
      { title: "Interactive Practice", type: "matching", duration: 5 },
      { title: "Knowledge Check", type: "quiz", duration: 3 },
    ],
  },
  {
    id: "deep-dive",
    title: "Deep-Dive Module",
    description: "Intensive 45-60 minute comprehensive training",
    duration: "50 min",
    icon: Brain,
    color: "border-purple-200 bg-purple-50",
    sections: [
      { title: "Course Introduction", type: "text", duration: 5 },
      { title: "Theoretical Foundation", type: "text", duration: 12 },
      { title: "Case Study Analysis", type: "story", duration: 10 },
      { type: "video", title: "Foundational Video", duration: 3 },
      { title: "Scenario Practice", type: "scenario", duration: 8 },
      { title: "Memory Techniques", type: "mnemonic", duration: 7 },
      { title: "Simulation Exercise", type: "simulation", duration: 5 },
      { title: "Final Assessment", type: "quiz", duration: 3 },
    ],
  },
  {
    id: "toolkit",
    title: "Toolkit Module",
    description: "Practical 30-40 minute skill-building session",
    duration: "35 min",
    icon: Wrench,
    color: "border-green-200 bg-green-50",
    sections: [
      { title: "Tool Overview", type: "text", duration: 5 },
      { title: "Step-by-Step Guide", type: "text", duration: 10 },
      { title: "Hands-On Practice", type: "example", duration: 8 },
      { title: "Common Challenges", type: "triage", duration: 7 },
      { title: "Application Check", type: "quiz", duration: 5 },
    ],
  },
  {
    id: "scenario-driven",
    title: "Scenario-Driven Module",
    description: "Interactive 25-35 minute scenario-based learning",
    duration: "30 min",
    icon: Users,
    color: "border-orange-200 bg-orange-50",
    sections: [
      { title: "Setting the Scene", type: "text", duration: 4 },
      { title: "Primary Scenario", type: "scenario", duration: 10 },
      { title: "Alternative Approaches", type: "scenario-match", duration: 8 },
      { title: "Best Practice Examples", type: "example", duration: 5 },
      { title: "Scenario Assessment", type: "quiz", duration: 3 },
    ],
  },
];

type Step = "template" | "topic" | "sections" | "preview";

interface ModuleConfig {
  title: string;
  description: string;
  topic: string;
  targetAudience: string;
  difficulty: string;
  pointValue: number;
  shareWithCommunity: boolean;
}

export default function NewModuleAI() {
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof PROVEN_TEMPLATES)[0] | null
  >(null);
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>({
    title: "",
    description: "",
    topic: "",
    targetAudience: "preschool-teachers",
    difficulty: "intermediate",
    pointValue: 10,
    shareWithCommunity: false,
  });
  const [sectionContents, setSectionContents] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<number | null>(
    null,
  );
  const [editingSections, setEditingSections] = useState<{
    [key: number]: boolean;
  }>({});
  const [manualContent, setManualContent] = useState<{ [key: number]: string }>(
    {},
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  console.log(sectionContents, "section contents");

  const handleTemplateSelect = (templateId: string) => {
    const template = PROVEN_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setModuleConfig((prev) => ({
        ...prev,
        title: `${template.title} - ${prev.topic || "New Topic"}`,
      }));
      // Initialize each section with null to properly track completion status
      setSectionContents(template.sections.map(() => null));
      setEditingSections({});
      setCurrentStep("topic");
    }
  };

  const handleTopicComplete = () => {
    if (moduleConfig.topic.trim()) {
      setModuleConfig((prev) => ({
        ...prev,
        title: `${selectedTemplate?.title} - ${prev.topic}`,
      }));
      setCurrentStep("sections");
    }
  };

  const generateSectionContent = async (sectionIndex: number) => {
    if (!selectedTemplate || generatingSection === sectionIndex) return;

    setGeneratingSection(sectionIndex);
    const section = selectedTemplate.sections[sectionIndex];

    try {
      const response = await fetch("/api/ai/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: moduleConfig.topic,
          sectionType: section.type,
          sectionTitle: section.title,
          targetAudience: moduleConfig.targetAudience,
          difficulty: moduleConfig.difficulty,
          templateContext: selectedTemplate.title,
        }),
      });

      if (response.ok) {
        const generatedContent = await response.json();
        setSectionContents((prev) => {
          const updated = [...prev];
          updated[sectionIndex] = generatedContent;
          return updated;
        });
      }
    } catch (error) {
      console.error("Error generating section content:", error);
    } finally {
      setGeneratingSection(null);
    }
  };

  const toggleSectionEdit = (sectionIndex: number) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const updateManualContent = (sectionIndex: number, content: string) => {
    setManualContent((prev) => ({
      ...prev,
      [sectionIndex]: content,
    }));

    // Update section contents with manual input
    setSectionContents((prev) => {
      const updated = [...prev];
      updated[sectionIndex] = {
        blocks: [
          {
            type: "manual",
            title: selectedTemplate?.sections[sectionIndex]?.title || "Section",
            content: content,
            preview:
              content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          },
        ],
      };
      return updated;
    });
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case "text":
        return "📝";
      case "example":
        return "💡";
      case "scenario":
        return "🎭";
      case "quiz":
        return "❓";
      case "video":
        return "🎬";
      case "matching":
        return "🔗";
      case "story":
        return "📖";
      case "mnemonic":
        return "🧠";
      case "simulation":
        return "⚡";
      case "triage":
        return "🎯";
      case "scenario-match":
        return "🎪";
      default:
        return "📋";
    }
  };

  const renderSectionBuilder = (section: any, index: number) => {
    const content = sectionContents[index];
    // All sections should default to editing mode
    const isEditing = editingSections[index] !== false;

    const handleContentChange = (updatedContent: any) => {
      setSectionContents((prev) => {
        const updated = [...prev];
        updated[index] = updatedContent;
        console.log(updated, "update contnent change");
        return updated;
      });
    };

    const handleEditToggle = () => {
      toggleSectionEdit(index);
    };

    const handleRegenerateAI = () => {
      generateSectionContent(index);
    };

    // Route to appropriate builder based on section type
    switch (section.type) {
      case "quiz":
        return (
          <QuizSectionBuilder
            key={`quiz-${index}`}
            content={content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "matching":
        return (
          <MatchingSectionBuilder
            key={`matching-${index}`}
            content={content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "scenario-match":
        return (
          <ScenarioMatchSectionBuilder
            key={`scenario-match-${index}`}
            content={content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );

      case "video":
        return (
          <VideoSectionBuilder
            key={`video-${index}`}
            content={content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
          />
        );

      case "text":
      case "example":
      case "scenario":
      case "story":
      default:
        return (
          <TextSectionBuilder
            key={`text-${index}`}
            content={content}
            onContentChange={handleContentChange}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onRegenerateAI={handleRegenerateAI}
          />
        );
    }
  };

  const saveModule = async () => {
    if (!selectedTemplate) return;

    const moduleData = {
      title: moduleConfig.title,
      description: moduleConfig.description || selectedTemplate.description,
      content: JSON.stringify(
        sectionContents.map((content, index) => ({
          title: selectedTemplate.sections[index].title,
          type: selectedTemplate.sections[index].type,
          duration: selectedTemplate.sections[index].duration,
          content: content?.blocks?.[0]?.content || "Generated content",
          activities: content?.activities || [],
        })),
      ),
      difficulty: moduleConfig.difficulty,
      category: "professional-development",
      duration: parseInt(selectedTemplate.duration.replace(" min", "")),
      pointValue: moduleConfig.pointValue,
    };

    try {
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });

      if (response.ok) {
        setLocation("/modules");
      }
    } catch (error) {
      console.error("Error saving module:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Module Creator
        </h1>
        <p className="text-gray-600">
          Create professional development modules using proven templates and AI
          assistance
        </p>
      </div>

      {/* Step 1: Template Selection */}
      {currentStep === "template" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Proven Template</CardTitle>
              <CardDescription>
                Select a template that best fits your educational objectives. AI
                will customize the content for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {PROVEN_TEMPLATES.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      } ${template.color}`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">
                              {template.title}
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {template.duration}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">
                          {template.description}
                        </p>
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700 mb-2">
                            Template Sections:
                          </div>
                          {template.sections.map((section, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded"
                            >
                              <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700">
                                {section.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="ml-auto text-xs"
                              >
                                {section.duration}m
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Share with Community Toggle */}
              <div className="mt-6 flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Switch
                  id="share-community"
                  checked={moduleConfig.shareWithCommunity}
                  onCheckedChange={(checked) =>
                    setModuleConfig((prev) => ({
                      ...prev,
                      shareWithCommunity: checked,
                    }))
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="share-community" className="text-sm font-medium">
                    Share with Community
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Make this module available to other educators in the community library
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Topic Input */}
      {currentStep === "topic" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Topic</CardTitle>
              <CardDescription>
                What topic would you like to create a module about? This will
                guide AI in generating relevant content for each section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTemplate && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <selectedTemplate.icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedTemplate.title}
                    </span>
                    <Badge variant="secondary">
                      {selectedTemplate.duration}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800">
                    {selectedTemplate.description}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="topic">Module Topic</Label>
                <Input
                  id="topic"
                  value={moduleConfig.topic}
                  onChange={(e) =>
                    setModuleConfig((prev) => ({
                      ...prev,
                      topic: e.target.value,
                    }))
                  }
                  placeholder="e.g., Positive Behavior Support, Classroom Management, Social-Emotional Learning..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">
                  Brief Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={moduleConfig.description}
                  onChange={(e) =>
                    setModuleConfig((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what this module should cover..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={moduleConfig.targetAudience}
                    onValueChange={(value) =>
                      setModuleConfig((prev) => ({
                        ...prev,
                        targetAudience: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preschool-teachers">
                        Preschool Teachers
                      </SelectItem>
                      <SelectItem value="daycare-providers">
                        Daycare Providers
                      </SelectItem>
                      <SelectItem value="administrators">
                        Administrators
                      </SelectItem>
                      <SelectItem value="support-staff">
                        Support Staff
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={moduleConfig.difficulty}
                    onValueChange={(value) =>
                      setModuleConfig((prev) => ({
                        ...prev,
                        difficulty: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pointValue">Point Value</Label>
                  <Select
                    value={moduleConfig.pointValue.toString()}
                    onValueChange={(value) =>
                      setModuleConfig((prev) => ({
                        ...prev,
                        pointValue: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 points (Quick)</SelectItem>
                      <SelectItem value="10">10 points (Standard)</SelectItem>
                      <SelectItem value="15">15 points (Standard)</SelectItem>
                      <SelectItem value="20">
                        20 points (Comprehensive)
                      </SelectItem>
                      <SelectItem value="25">
                        25 points (Comprehensive)
                      </SelectItem>
                      <SelectItem value="30">
                        30 points (Comprehensive)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("template")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
                <Button
                  onClick={handleTopicComplete}
                  disabled={!moduleConfig.topic.trim()}
                >
                  Continue to Sections
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Section Building - New Sidebar Layout */}
      {currentStep === "sections" && selectedTemplate && (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Module Outline */}
          <div className="w-80 flex-shrink-0">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Module Outline</CardTitle>
                <CardDescription className="text-sm">
                  Custom Template
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {selectedTemplate.sections.map((section, index) => (
                    <div
                      key={index}
                      className={`p-3 mx-4 mb-2 rounded-lg border cursor-pointer transition-all ${
                        currentSectionIndex === index
                          ? "bg-purple-100 border-purple-300"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setCurrentSectionIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                            currentSectionIndex === index
                              ? "bg-purple-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {section.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {section.type}
                          </div>
                        </div>
                        {sectionContents[index] &&
                          sectionContents[index].blocks &&
                          sectionContents[index].blocks.length > 0 && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area - Section Builder */}
          <div className="flex-1 min-w-0">
            <Card className="h-full">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      Build Section {currentSectionIndex + 1}:{" "}
                      {selectedTemplate.sections[currentSectionIndex]?.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      AI will use the module topic above to generate relevant
                      content for this section
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {
                      selectedTemplate.sections[currentSectionIndex]?.duration
                    }{" "}
                    min
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto">
                {/* Render all section types with their builders */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      onClick={() => toggleSectionEdit(currentSectionIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Type Content
                    </Button>
                    {selectedTemplate.sections[currentSectionIndex].type !==
                      "video" && (
                      <Button
                        onClick={() =>
                          generateSectionContent(currentSectionIndex)
                        }
                        disabled={generatingSection === currentSectionIndex}
                        size="sm"
                      >
                        {generatingSection === currentSectionIndex ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    {renderSectionBuilder(
                      selectedTemplate.sections[currentSectionIndex],
                      currentSectionIndex,
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentSectionIndex > 0) {
                          setCurrentSectionIndex(currentSectionIndex - 1);
                        }
                      }}
                      disabled={currentSectionIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous Section
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        Save Section
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            currentSectionIndex <
                            selectedTemplate.sections.length - 1
                          ) {
                            setCurrentSectionIndex(currentSectionIndex + 1);
                          } else {
                            setCurrentStep("preview");
                          }
                        }}
                      >
                        {currentSectionIndex ===
                        selectedTemplate.sections.length - 1
                          ? "Preview Module"
                          : "Save & Next Section"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Preview and Save */}
      {currentStep === "preview" && selectedTemplate && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Preview</CardTitle>
              <CardDescription>
                Review your AI-generated module before saving it to your library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <selectedTemplate.icon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedTemplate.title} - {moduleConfig.topic}
                  </h3>
                  <Badge variant="secondary">{selectedTemplate.duration}</Badge>
                </div>
                <p className="text-gray-700 mb-4">
                  {moduleConfig.description || selectedTemplate.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Target Audience:
                    </span>
                    <div className="text-gray-800 capitalize">
                      {moduleConfig.targetAudience.replace("-", " ")}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Difficulty:
                    </span>
                    <div className="text-gray-800 capitalize">
                      {moduleConfig.difficulty}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sections:</span>
                    <div className="text-gray-800">
                      {selectedTemplate.sections.length} sections
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Generated Sections:
                </h4>
                {selectedTemplate.sections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{section.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {section.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {section.duration}m
                      </Badge>
                      {sectionContents[index] && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                    {sectionContents[index] && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {sectionContents[index]?.blocks?.[0]?.preview ||
                          sectionContents[
                            index
                          ]?.blocks?.[0]?.content?.substring(0, 150) + "..." ||
                          "AI-generated content ready"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("sections")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sections
                </Button>
                <Button
                  onClick={saveModule}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
