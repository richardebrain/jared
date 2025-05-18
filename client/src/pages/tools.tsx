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
      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.03] ${
        selected ? 'border-primary/70 border-2 shadow-md shadow-primary/20' : 'border border-indigo-100'
      } overflow-hidden rounded-2xl`}
      onClick={onClick}
    >
      <div className={`h-1.5 w-full ${selected ? 'bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-400' : 'bg-gradient-to-r from-blue-100 to-purple-100'}`}></div>
      <CardContent className="p-6 flex flex-col items-center text-center gap-3 relative">
        {/* Decorative dots in corners for cute effect */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-300"></div>
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-pink-300"></div>
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-cyan-300"></div>
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-300"></div>
        
        {/* Animated icon container */}
        <div className={`rounded-full p-3.5 transition-all ${
          selected 
            ? 'bg-gradient-to-br from-purple-100 to-indigo-100 shadow-md text-primary transform -rotate-3' 
            : 'bg-gradient-to-br from-purple-50 to-indigo-50 text-primary/80'
        }`}>
          {icon}
        </div>
        
        <h3 className={`font-semibold text-lg transition-colors ${selected ? 'text-primary' : 'text-gray-700'}`}>
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Subtle animated highlight effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-1000 ease-in-out ${selected ? 'animate-shimmer' : 'opacity-0'}`}></div>
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
          <div className="text-center mb-6">
            <div className="mb-3 inline-block py-1 px-3 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-sm font-medium">
              Coming Soon
            </div>
            <p className="text-muted-foreground max-w-lg">
              Swipe through bite-sized teaching tips, classroom management ideas, and quick activities in a fun, easy-to-consume format.
            </p>
          </div>
          <Button 
            size="lg" 
            className="gap-2"
            disabled
          >
            <Smartphone className="h-5 w-5" />
            EduTok Experience Coming Soon
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto p-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 gap-1.5">
              {tools.map(tool => (
                <TabsTrigger 
                  key={tool.id}
                  value={tool.id} 
                  className="flex flex-col md:flex-row items-center py-2.5 md:py-1.5 px-2 md:px-3 gap-1.5 md:gap-2 text-xs md:text-sm rounded-lg relative overflow-hidden group transition-all data-[state=active]:shadow-md"
                >
                  {/* Colorful indicator dots */}
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-pink-300 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-cyan-300 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
                  
                  {/* Icon with cute effect */}
                  <div className="text-primary/70 group-data-[state=active]:text-primary transition-all group-hover:scale-110 group-data-[state=active]:-rotate-3">
                    {tool.icon}
                  </div>
                  
                  {/* Text with gradient when active */}
                  <span className="text-center md:text-left font-medium group-data-[state=active]:bg-gradient-to-r group-data-[state=active]:from-primary group-data-[state=active]:to-purple-500 group-data-[state=active]:bg-clip-text group-data-[state=active]:text-transparent">
                    {tool.title.split(' ')[0]}
                  </span>
                  
                  {/* Animated colorful bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tools.map(tool => (
              <TabsContent key={tool.id} value={tool.id} className="space-y-4">
                <Card className="rounded-xl overflow-hidden border-2 border-indigo-100">
                  {/* Decorative header bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-400"></div>
                  
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2.5">
                      {/* Cute animated icon */}
                      <div className="text-primary p-2.5 bg-white rounded-full shadow-sm transform -rotate-3 transition-all hover:rotate-0">
                        {tool.icon}
                      </div>
                      
                      {/* Title with gradient text */}
                      <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {tool.title}
                      </span>
                    </CardTitle>
                    
                    <CardDescription className="text-indigo-700/70 mt-0.5">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-8 relative">
                    {/* Corner decorations */}
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-300"></div>
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-pink-300"></div>
                    
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