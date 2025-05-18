import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import { SuessifyGenerator } from "@/components/SuessifyGenerator";
import { VideoResourceLibrary } from "@/components/VideoResourceLibrary";
import { MeetingScheduler } from "@/components/MeetingScheduler";
import LessonPlanMaker from "@/components/LessonPlanMaker";
import ParentResponseGenerator, { ParentScenario } from "@/components/ParentResponseGenerator";
import TransitionTimerTool from "@/components/TransitionTimerTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, BookOpen, Video, CalendarDays, ClipboardCheck, 
  GraduationCap, Lightbulb, Stars, BadgeHelp, PencilRuler, Timer,
  Smartphone
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
      className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
        selected ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("parent-responses");
  const [viewMode, setViewMode] = useState<"cards" | "tabs">("cards");

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
      title: "Lesson Plan Maker",
      description: "Create engaging, age-appropriate lesson plans",
      icon: <ClipboardCheck className="h-6 w-6" />,
      component: (
        <LessonPlanMaker />
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
      id: "edutok",
      title: "EduTok",
      description: "Quick teaching tips in TikTok-style short videos",
      icon: <Smartphone className="h-6 w-6" />,
      component: (
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-xl font-semibold mb-4">EduTok - Teaching Wisdom in Shorts</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-lg">
            Swipe through bite-sized teaching tips, classroom management ideas, and quick activities in a fun, easy-to-consume format.
          </p>
          <Button 
            size="lg" 
            className="gap-2" 
            onClick={() => window.location.href = "/edutok"}
          >
            <Smartphone className="h-5 w-5" />
            Open EduTok Experience
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
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                Teacher Tools
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered resources to enhance your teaching experience
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode(viewMode === "cards" ? "tabs" : "cards")}
            >
              {viewMode === "cards" ? "Tab View" : "Card View"}
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
        
        {viewMode === "cards" ? (
          <>
            {/* Card selector view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
            
            {/* Active tool display */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-primary">
                    {activeTool?.icon}
                  </div>
                  {activeTool?.title}
                </CardTitle>
                <CardDescription>
                  {activeTool?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
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