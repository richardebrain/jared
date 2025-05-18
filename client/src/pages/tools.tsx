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
        selected ? 'border-primary border-2 shadow-lg shadow-primary/10' : 'border border-gray-200'
      } overflow-hidden`}
      onClick={onClick}
    >
      {/* Progress indicator for selected tools */}
      <div className={`h-1 w-full bg-gray-100 ${selected ? 'bg-primary/10' : ''}`}>
        {selected && (
          <div className="h-full w-2/3 bg-primary"></div>
        )}
      </div>
      
      <CardContent className="p-5 flex flex-col items-center text-center gap-4 relative">
        {/* XP Points for gamification */}
        <div className="absolute top-2 right-2 bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold text-gray-600">
          +5 XP
        </div>
        
        {/* Icon container with button-like appearance */}
        <div className={`w-14 h-14 flex items-center justify-center rounded-lg transition-all ${
          selected 
            ? 'bg-primary text-white shadow-md' 
            : 'bg-gray-100 text-primary-foreground hover:bg-gray-200'
        }`}>
          {icon}
        </div>
        
        {/* Title with badge for active tools */}
        <div className="relative">
          <h3 className={`font-bold text-base ${selected ? 'text-primary' : 'text-gray-800'}`}>
            {title}
          </h3>
          
          {/* Tool level indicator */}
          <div className="absolute -top-4 -right-8 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded font-medium">
            Lv. {Math.floor(Math.random() * 3) + 1}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">{description}</p>
        
        {/* Action button */}
        <div className={`mt-1 text-xs font-medium py-1 px-3 rounded-full ${
          selected 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          {selected ? 'ACTIVE' : 'SELECT'}
        </div>
        
        {/* Usage meter for gamification */}
        {selected && (
          <div className="w-full mt-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uses Today</span>
              <span>3/5</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto p-2 bg-gray-100 rounded-md gap-1">
              {tools.map(tool => (
                <TabsTrigger 
                  key={tool.id}
                  value={tool.id} 
                  className="flex flex-col md:flex-row items-center py-2 md:py-1.5 px-2 md:px-3 gap-1.5 md:gap-2 text-xs md:text-sm 
                    rounded-md relative overflow-hidden group transition-all 
                    data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {/* Progress bar for active tools */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent">
                    {tool.id === activeTab && <div className="h-full w-3/4 bg-primary"></div>}
                  </div>
                  
                  {/* XP indicator for active tools */}
                  {tool.id === activeTab && 
                    <div className="absolute -top-1 -right-1 bg-amber-100 text-amber-700 text-[10px] px-1 rounded">+XP</div>
                  }
                  
                  {/* Icon container */}
                  <div className={`p-1 rounded transition-all ${
                    tool.id === activeTab 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tool.icon}
                  </div>
                  
                  {/* Tool name */}
                  <span className={`text-center md:text-left font-medium 
                    ${tool.id === activeTab ? 'text-primary' : 'text-gray-700'}`}>
                    {tool.title.split(' ')[0]}
                  </span>
                  
                  {/* Usage meter dot */}
                  {tool.id === activeTab && (
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  )}
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