import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  Share2,
  Users,
  UserCheck,
  Globe,
  Brain,
  Wrench,
  Edit,
  Type,
  FileText,
  Save,
  RefreshCw,
  Clock,
  Search,
  Mic,
  MicOff,
  Volume2,
  Image,
  Palette,
  Trash2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import QuizSectionBuilder from "@/components/SectionBuilders/QuizSectionBuilder";
import MatchingSectionBuilder from "@/components/SectionBuilders/MatchingSectionBuilder";
import ScenarioMatchSectionBuilder from "@/components/SectionBuilders/ScenarioMatchSectionBuilder";
import VideoSectionBuilder from "@/components/SectionBuilders/VideoSectionBuilder";
import TextSectionBuilder from "@/components/SectionBuilders/TextSectionBuilder";
import VoiceInputTextarea from "@/components/VoiceInputTextarea";
import VoiceEnabledInput from "@/components/VoiceEnabledInput";

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
      { type: "video", title: "Video or Case Story", duration: 6 },
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
      { type: "video", title: "Foundational Video", duration: 6 },
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
  {
    id: "custom",
    title: "Custom Template",
    description: "Build your own module with custom sections in any order",
    duration: "Variable",
    icon: Palette,
    color: "border-indigo-200 bg-indigo-50",
    sections: [
      { title: "Welcome Section", type: "text", duration: 3 },
    ],
  },
];

type Step = "template" | "topic" | "sections" | "preview" | "publish";

interface ModuleConfig {
  title: string;
  description: string;
  topic: string;
  targetAudience: string;
  difficulty: string;
  pointValue: number;
}

interface PublishSettings {
  type: "teachers" | "groups" | "library" | "community";
  selectedTeachers: string[];
  selectedGroups: string[];
  customMessage: string;
  includeInLibrary: boolean;
  allowComments: boolean;
  publishToSection: boolean;
  publishToCommunity: boolean;
}

export default function NewModuleAI() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
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
  });
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    type: "library",
    selectedTeachers: [],
    selectedGroups: [],
    customMessage: "",
    includeInLibrary: true,
    allowComments: true,
    publishToSection: false,
    publishToCommunity: false,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateGuidance, setRegenerateGuidance] = useState("");
  const [sectionToRegenerate, setSectionToRegenerate] = useState<number | null>(null);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  console.log(sectionContents, "section contents");

  const handleTemplateSelect = (templateId: string) => {
    const template = PROVEN_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setModuleConfig((prev) => ({
        ...prev,
        title: `${template.title} - ${prev.topic || "New Topic"}`,
      }));
      
      // For custom template, initialize custom sections management
      if (templateId === "custom") {
        setCustomSections([...template.sections]);
      }
      
      // Initialize each section with null to properly track completion status
      setSectionContents(template.sections.map(() => null));
      setEditingSections({});
      setCurrentStep("topic");
    }
  };

  // Section management functions for custom template
  const addSection = (type: string, title: string, duration: number) => {
    if (selectedTemplate?.id === "custom") {
      const newSection = { title, type, duration };
      const updatedSections = [...customSections, newSection];
      setCustomSections(updatedSections);
      
      // Update selected template with new sections
      setSelectedTemplate({
        ...selectedTemplate,
        sections: updatedSections
      });
      
      // Add empty content for new section
      setSectionContents([...sectionContents, null]);
    }
  };

  const deleteCustomSection = (index: number) => {
    if (selectedTemplate?.id === "custom" && customSections.length > 1) {
      const updatedSections = customSections.filter((_, i) => i !== index);
      setCustomSections(updatedSections);
      
      // Update selected template
      setSelectedTemplate({
        ...selectedTemplate,
        sections: updatedSections
      });
      
      // Remove content for deleted section
      const updatedContents = sectionContents.filter((_, i) => i !== index);
      setSectionContents(updatedContents);
      
      // Adjust current section index if needed
      if (currentSectionIndex >= updatedSections.length) {
        setCurrentSectionIndex(Math.max(0, updatedSections.length - 1));
      }
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (selectedTemplate?.id === "custom") {
      const updatedSections = [...customSections];
      const [movedSection] = updatedSections.splice(fromIndex, 1);
      updatedSections.splice(toIndex, 0, movedSection);
      
      setCustomSections(updatedSections);
      setSelectedTemplate({
        ...selectedTemplate,
        sections: updatedSections
      });
      
      // Reorder content accordingly
      const updatedContents = [...sectionContents];
      const [movedContent] = updatedContents.splice(fromIndex, 1);
      updatedContents.splice(toIndex, 0, movedContent);
      setSectionContents(updatedContents);
    }
  };

  const handleDeleteSection = (sectionIndex: number) => {
    setSectionToDelete(sectionIndex);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSection = () => {
    if (selectedTemplate && sectionToDelete !== null) {
      const updatedSections = selectedTemplate.sections.filter((_, index) => index !== sectionToDelete);
      const updatedContents = sectionContents.filter((_, index) => index !== sectionToDelete);
      
      setSelectedTemplate({
        ...selectedTemplate,
        sections: updatedSections
      });
      setSectionContents(updatedContents);
      
      // Adjust current section index if needed
      if (currentSectionIndex >= updatedSections.length) {
        setCurrentSectionIndex(Math.max(0, updatedSections.length - 1));
      } else if (currentSectionIndex > sectionToDelete) {
        setCurrentSectionIndex(currentSectionIndex - 1);
      }
    }
    setShowDeleteDialog(false);
    setSectionToDelete(null);
    toast({
      title: "Section Deleted",
      description: "The section has been removed from your module.",
    });
  };

  const handleRegenerateWithGuidance = (sectionIndex: number) => {
    setSectionToRegenerate(sectionIndex);
    setRegenerateGuidance("");
    setShowRegenerateDialog(true);
  };

  const confirmRegenerateSection = async () => {
    if (selectedTemplate && sectionToRegenerate !== null) {
      setGeneratingSection(sectionToRegenerate);
      setShowRegenerateDialog(false);
      
      try {
        const section = selectedTemplate.sections[sectionToRegenerate];
        const guidance = regenerateGuidance.trim() 
          ? `Additional guidance: ${regenerateGuidance}` 
          : "";
        
        await generateSectionContent(sectionToRegenerate, guidance);
        
        toast({
          title: "Section Regenerated",
          description: "The section has been regenerated with your guidance.",
        });
      } catch (error) {
        toast({
          title: "Regeneration Failed",
          description: "Unable to regenerate section. Please try again.",
          variant: "destructive"
        });
      }
    }
    setSectionToRegenerate(null);
    setRegenerateGuidance("");
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

  console.log(sectionContents,'section contents to make quiz generate questioms')

  const generateSectionContent = async (sectionIndex: number, customGuidance?: string) => {
    if (!selectedTemplate || generatingSection === sectionIndex) return;

    setGeneratingSection(sectionIndex);
    const section = selectedTemplate.sections[sectionIndex];

    try {
      const response = await fetch("/api/ai-suggestions/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: moduleConfig.topic,
          sectionType: section.type,
          sectionTitle: section.title,
          targetAudience: moduleConfig.targetAudience,
          difficulty: moduleConfig.difficulty,
          templateContext: selectedTemplate.title,
          dependsOn: sectionContents,
          customGuidance: customGuidance
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

  const saveModule = async (publishSettings: PublishSettings) => {
    console.log(moduleConfig,'module configuration',selectedTemplate)
    if (!selectedTemplate) return;

    const moduleData = {
      title: moduleConfig.title,
      description: moduleConfig.description || selectedTemplate.description,
      category: "professional-development",
      difficulty: moduleConfig.difficulty,
      estimatedTime: parseInt(selectedTemplate.duration.replace(" min", "")).toString(),
      customPoints: moduleConfig.pointValue.toString(),
      sections: sectionContents.map((content, index) => ({
        title: selectedTemplate.sections[index].title,
        type: selectedTemplate.sections[index].type,
        duration: selectedTemplate.sections[index].duration,
        content: content?.blocks?.[0]?.content || "Generated content",
        videoUrl: "",
        imageUrl: "",
        activities: content?.activities || [],
      })),
      moduleType: publishSettings.type,
      courseStructure: {},
      interactiveElements: {},
      certificationSystem: {}
    };

    try {
      const response = await fetch("/api/modules/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleData,
          type: publishSettings.type,
          selectedTeachers: publishSettings.selectedTeachers || [],
          selectedGroups: publishSettings.selectedGroups || [],
          customMessage: publishSettings.customMessage || "",
          includeInLibrary: publishSettings.includeInLibrary,
          allowComments: publishSettings.allowComments,
          publishToSection: publishSettings.publishToSection,
          publishToCommunity: publishSettings.publishToCommunity
        }),
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
                <div className="mt-1">
                  <VoiceEnabledInput
                    id="topic"
                    value={moduleConfig.topic}
                    onChange={(value) =>
                      setModuleConfig((prev) => ({
                        ...prev,
                        topic: value,
                      }))
                    }
                    placeholder="e.g., Positive Behavior Support, Classroom Management, Social-Emotional Learning... (Click microphone for voice input)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">
                  Brief Description (Optional)
                </Label>
                <div className="mt-1">
                  <VoiceInputTextarea
                    value={moduleConfig.description}
                    onChange={(value) =>
                      setModuleConfig((prev) => ({
                        ...prev,
                        description: value,
                      }))
                    }
                    placeholder="Describe what this module should cover... (Click the microphone to use voice input)"
                    minHeight="min-h-[80px]"
                  />
                </div>
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
                        <div className="flex items-center gap-1">
                          {sectionContents[index] &&
                            sectionContents[index].blocks &&
                            sectionContents[index].blocks.length > 0 && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          {selectedTemplate.id === "custom" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomSection(index);
                              }}
                              disabled={selectedTemplate.sections.length <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Section Button for Custom Template */}
                  {selectedTemplate.id === "custom" && (
                    <div className="mx-4 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setShowAddSectionDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  )}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
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
                        <>
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
                          <Button
                            onClick={() => handleRegenerateWithGuidance(currentSectionIndex)}
                            variant="outline"
                            size="sm"
                            disabled={generatingSection === currentSectionIndex}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate with Guidance
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTemplate.sections.length > 1 && (
                        <Button
                          onClick={() => handleDeleteSection(currentSectionIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Section
                        </Button>
                      )}
                    </div>
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
                        {(() => {
                          const content = sectionContents[index];
                          if (typeof content === 'string') {
                            try {
                              const parsed = JSON.parse(content);
                              if (parsed.title) {
                                return `${parsed.title}${parsed.videoUrl ? ' - Video Content' : ''}`;
                              }
                              if (parsed.videoUrl) {
                                return `Video: ${parsed.videoUrl.substring(0, 50)}...`;
                              }
                            } catch (e) {
                              return content.substring(0, 150) + "...";
                            }
                          }
                          if (content?.blocks?.[0]?.preview) {
                            return content.blocks[0].preview;
                          }
                          if (content?.blocks?.[0]?.content) {
                            return content.blocks[0].content.substring(0, 150) + "...";
                          }
                          return "Content ready";
                        })()}
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
                  onClick={() => setCurrentStep("publish")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Publish Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Publishing Step */}
      {currentStep === "publish" && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Publish Your Module
              </CardTitle>
              <p className="text-muted-foreground">
                Choose how to share "{moduleConfig.title}" with your community
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Button
                  variant={publishSettings.type === "teachers" ? "default" : "outline"}
                  onClick={() => setPublishSettings(prev => ({ ...prev, type: "teachers" }))}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Individual Teachers</span>
                </Button>
                <Button
                  variant={publishSettings.type === "groups" ? "default" : "outline"}
                  onClick={() => setPublishSettings(prev => ({ ...prev, type: "groups" }))}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <UserCheck className="h-6 w-6 mb-2" />
                  <span className="text-sm">Groups</span>
                </Button>
                <Button
                  variant={publishSettings.type === "library" ? "default" : "outline"}
                  onClick={() => setPublishSettings(prev => ({ ...prev, type: "library" }))}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span className="text-sm">Module Section</span>
                </Button>
                <Button
                  variant={publishSettings.type === "community" ? "default" : "outline"}
                  onClick={() => setPublishSettings(prev => ({ ...prev, type: "community" }))}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Globe className="h-6 w-6 mb-2" />
                  <span className="text-sm">Community</span>
                </Button>
              </div>

              {publishSettings.type === "teachers" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Select Individual Teachers</h3>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-muted-foreground text-sm mb-4">
                      Choose specific teachers to share this module with
                    </p>
                    <div className="space-y-2">
                      {["Sarah Johnson", "Mike Chen", "Elena Rodriguez", "David Kim", "Anna Thompson"].map((teacher) => (
                        <label key={teacher} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={publishSettings.selectedTeachers.includes(teacher)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPublishSettings(prev => ({
                                  ...prev,
                                  selectedTeachers: [...prev.selectedTeachers, teacher]
                                }));
                              } else {
                                setPublishSettings(prev => ({
                                  ...prev,
                                  selectedTeachers: prev.selectedTeachers.filter(t => t !== teacher)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span>{teacher}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {publishSettings.type === "groups" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Select Groups</h3>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-muted-foreground text-sm mb-4">
                      Choose groups to share this module with
                    </p>
                    <div className="space-y-2">
                      {["Preschool Team", "Lead Teachers", "New Hires", "Professional Development", "Administrative Staff"].map((group) => (
                        <label key={group} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={publishSettings.selectedGroups.includes(group)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPublishSettings(prev => ({
                                  ...prev,
                                  selectedGroups: [...prev.selectedGroups, group]
                                }));
                              } else {
                                setPublishSettings(prev => ({
                                  ...prev,
                                  selectedGroups: prev.selectedGroups.filter(g => g !== group)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span>{group}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {publishSettings.type === "library" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Module Section Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishSettings.includeInLibrary}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, includeInLibrary: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Include in module library</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishSettings.allowComments}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Allow comments and feedback</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishSettings.publishToSection}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, publishToSection: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Publish to specific section</span>
                    </label>
                  </div>
                </div>
              )}

              {publishSettings.type === "community" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Community Sharing</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishSettings.publishToCommunity}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, publishToCommunity: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Share with the broader MentorMe community</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishSettings.allowComments}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Allow community comments</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={publishSettings.customMessage}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                        placeholder="Add a message about this module..."
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("preview")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Preview
                </Button>
                <Button
                  onClick={() => saveModule(publishSettings)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section Deletion Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Section</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{selectedTemplate?.sections[sectionToDelete || 0]?.title}"? 
              All content for this section will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSectionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSection}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Regeneration Dialog */}
      {showRegenerateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Regenerate with Guidance</h3>
                <p className="text-sm text-gray-600">Provide specific instructions for AI</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="regenerate-guidance">
                  How would you like this section to be different?
                </Label>
                <Textarea
                  id="regenerate-guidance"
                  value={regenerateGuidance}
                  onChange={(e) => setRegenerateGuidance(e.target.value)}
                  placeholder="e.g., Make it more interactive, focus on practical examples, include more case studies, simplify the language..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div className="text-xs text-gray-500">
                <strong>Section:</strong> {selectedTemplate?.sections[sectionToRegenerate || 0]?.title}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRegenerateDialog(false);
                  setSectionToRegenerate(null);
                  setRegenerateGuidance("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRegenerateSection}
                disabled={!regenerateGuidance.trim()}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Regenerate Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
