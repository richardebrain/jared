import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import { SuessifyGenerator } from "@/components/SuessifyGenerator";
import { VideoResourceLibrary } from "@/components/VideoResourceLibrary";
import { MeetingScheduler } from "@/components/MeetingScheduler";
import LessonPlanMaker from "@/components/LessonPlanMaker";
import ParentResponseGenerator, { ParentScenario } from "@/components/ParentResponseGenerator";
import TransitionTimerTool from "@/components/TransitionTimerTool";
import { HelpMeWithThisKid } from "@/components/HelpMeWithThisKid";
import PortfolioBuilder from "@/pages/PortfolioBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, BookOpen, Video, CalendarDays, ClipboardCheck, 
  GraduationCap, Lightbulb, Stars, BadgeHelp, PencilRuler, Timer,
  Heart, Sparkles, UserCheck, Camera
} from "lucide-react";

// Example scenarios for parent communication
const PARENT_SCENARIOS: ParentScenario[] = [
  {
    title: "Biting Incident",
    description: "How to communicate with a parent about their child biting another student",
    prompt: "I need to inform a parent that their 3-year-old bit another child today. I want to be honest but supportive."
  },
  {
    title: "Developmental Concerns", 
    description: "Discussing potential developmental delays with sensitivity",
    prompt: "I've noticed some potential speech delays in a 4-year-old and need to bring this up with the parents who might not be aware."
  },
  {
    title: "Toilet Training Challenges",
    description: "Addressing toilet training consistency between school and home",
    prompt: "We're having difficulty with toilet training consistency at school, but the parents insist their child is fully trained at home."
  },
  {
    title: "Screen Time Concerns",
    description: "Discussing excessive screen time at home affecting classroom behavior",
    prompt: "A child is regularly talking about extended screen time and shows signs of difficulty focusing. I need to discuss this tactfully with the parents."
  },
  {
    title: "Aggressive Behavior",
    description: "Addressing recurring aggressive behavior in a supportive way",
    prompt: "A child has been showing aggressive behavior toward peers for two weeks. I need to discuss this with parents in a way that focuses on solutions."
  }
];

// ToolCard component for the card-based layout
interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  selected: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, onClick, selected }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105 transform relative overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border-2 ${
        selected ? 'border-purple-400 ring-4 ring-purple-200 shadow-2xl scale-105' : 'border-purple-200 hover:border-purple-300'
      }`}
      onClick={onClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-50/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
      {/* Floating animation circle */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-12 -mt-12 transition-transform duration-700 ${selected ? 'scale-150' : 'group-hover:scale-150'}`}></div>
      
      <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative z-10">
        <div className={`rounded-full p-4 transition-all duration-500 shadow-lg ${
          selected 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rotate-6 scale-110' 
            : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:rotate-6 hover:scale-110'
        }`}>
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className={`font-bold text-lg transition-colors duration-300 ${
            selected ? 'text-purple-600' : 'text-gray-800 hover:text-purple-600'
          }`}>
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
        {selected && (
          <div className="flex items-center gap-1 text-purple-600 font-medium text-sm animate-pulse">
            <Stars className="h-4 w-4" />
            Active Tool
            <Stars className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("parent-responses");
  const [viewMode, setViewMode] = useState<"cards" | "tabs">("tabs");

  // Tools definitions
  const tools = [
    {
      id: "parent-responses",
      title: "Parent Response Generator",
      description: "Craft professional communications for parent interactions",
      icon: <MessageSquare className="h-6 w-6" />,
      component: (
        <ParentResponseGenerator scenarios={PARENT_SCENARIOS} />
      )
    },
    {
      id: "lesson-plan",
      title: "Lesson Plan Tools",
      description: "Create engaging, age-appropriate lesson plans with basic or advanced features",
      icon: <ClipboardCheck className="h-6 w-6" />,
      component: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Basic Lesson Plan
                </CardTitle>
                <CardDescription>
                  Quick and simple lesson plan creation with essential elements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Perfect for everyday lesson planning with core activities, objectives, and materials.
                </p>
                <div className="space-y-4">
                  <LessonPlanMaker />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Advanced Lesson Plan
                </CardTitle>
                <CardDescription>
                  Comprehensive lesson planning with Arizona Early Learning Standards integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create detailed lesson plans with standards alignment, enhanced formatting, and professional presentation.
                </p>
                <Link href="/lesson-plan-creator">
                  <Button className="w-full">
                    Open Advanced Creator
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: "personalized-stories-creator",
      title: "Stories",
      description: "Create custom behavioral stories with children's names and voice narration",
      icon: <Sparkles className="h-6 w-6" />,
      component: (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-semibold mb-4">Personalized Stories Creator</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Create custom stories featuring children's names with character themes like Spider-Man and unicorns. 
            Stories include hero's journeys, mindful mornings techniques, and professional voice narration.
          </p>
          <Link href="/personalized-stories">
            <Button className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Open Personalized Stories
            </Button>
          </Link>
        </div>
      )
    },
    {
      id: "transition-timer",
      title: "Transition Timer",
      description: "Help children transition smoothly between activities",
      icon: <Timer className="h-6 w-6" />,
      component: (
        <TransitionTimerTool />
      )
    },
    {
      id: "suessify",
      title: "Suessify Generator",
      description: "Transform text into Dr. Seuss-style rhymes",
      icon: <BookOpen className="h-6 w-6" />,
      component: (
        <SuessifyGenerator />
      )
    },
    {
      id: "video-library",
      title: "Video Library",
      description: "Access educational videos for professional growth",
      icon: <Video className="h-6 w-6" />,
      component: (
        <VideoResourceLibrary showFilters={true} compactMode={true} />
      )
    },
    {
      id: "help-me-with-this-kid",
      title: "Help Me With This Kid",
      description: "Expert strategies for challenging behaviors",
      icon: <UserCheck className="h-6 w-6" />,
      component: <HelpMeWithThisKid />
    },
    {
      id: "portfolio-builder",
      title: "Child Portfolio Builder",
      description: "AI-powered photo analysis and portfolio creation",
      icon: <Camera className="h-6 w-6" />,
      component: (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-semibold mb-4">Child Portfolio Builder</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Create and manage child portfolios with AI-powered photo analysis. 
            Access is limited to children you create or those shared with your school.
          </p>
          <Button 
            onClick={() => window.open('/portfolio-builder', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Open Portfolio Builder
          </Button>
        </div>
      )
    },
    {
      id: "meeting-scheduler",
      title: "Director Meeting Scheduler",
      description: "Book time with your school director",
      icon: <CalendarDays className="h-6 w-6" />,
      component: (
        <MeetingScheduler />
      )
    }
  ];

  // Find the active tool
  const activeTool = tools.find(tool => tool.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-8 w-28 h-28 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-16 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-24 left-24 w-36 h-36 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-16 right-8 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <Header />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Teacher Toolkit
                </h1>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-full shadow-lg">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI-powered resources to enhance your teaching experience and classroom management.
            </p>
          </div>
          
          <div className="flex gap-3 ml-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode(viewMode === "cards" ? "tabs" : "cards")}
              className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 transition-all duration-300 shadow-lg"
            >
              {viewMode === "cards" ? "📑 Tab View" : "🎴 Card View"}
            </Button>
            <Link to="/dashboard">
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 transition-all duration-300 shadow-lg"
              >
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        {viewMode === "cards" ? (
          <>
            {/* Enhanced Card selector view */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Choose Your Teaching Tool
              </h2>

            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              {tools.map(tool => (
                <ToolCard
                  key={tool.id}
                  icon={tool.icon}
                  title={tool.title}
                  description={tool.description}
                  onClick={() => setActiveTab(tool.id)}
                  selected={activeTab === tool.id}
                />
              ))}
            </div>
            
            {/* Enhanced Active tool display */}
            <Card className="mt-8 bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm border-2 border-purple-200 shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -ml-16 -mb-16"></div>
              
              <CardHeader className="relative z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    {activeTool?.icon}
                  </div>
                  <div>
                    <span className="flex items-center gap-2">
                      ✨ {activeTool?.title}
                      <div className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                        ACTIVE
                      </div>
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-purple-100 mt-2">
                  {activeTool?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 relative z-10">
                {activeTool?.component}
              </CardContent>
            </Card>
          </>
        ) : (
          // Tab view (original layout)
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto p-1">
              {tools.map(tool => (
                <TabsTrigger 
                  key={tool.id}
                  value={tool.id} 
                  className="flex flex-col md:flex-row items-center py-2 md:py-1 px-1 md:px-2 gap-1 md:gap-2 text-xs md:text-sm"
                >
                  <div className="text-primary">
                    {tool.icon}
                  </div>
                  <span className="text-center md:text-left">{tool.title.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tools.map(tool => (
              <TabsContent key={tool.id} value={tool.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="text-primary">
                        {tool.icon}
                      </div>
                      {tool.title}
                    </CardTitle>
                    <CardDescription>
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tool.component}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
}