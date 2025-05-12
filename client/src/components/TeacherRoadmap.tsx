import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import roadmapImage from '@assets/lead-teacher-roadmap.png';
import { cn } from '@/lib/utils';

type RoadmapStage = {
  id: number;
  title: string;
  weeks: string;
  description: string;
  color: string;
  completed?: boolean;
  current?: boolean;
};

interface TeacherRoadmapProps {
  currentStage?: number;
  completedStages?: number[];
  userLevel?: string;
}

export default function TeacherRoadmap({ 
  currentStage = 1, 
  completedStages = [], 
  userLevel = "Teacher in Training"
}: TeacherRoadmapProps) {
  const [showFullRoadmap, setShowFullRoadmap] = useState(false);
  
  const roadmapStages: RoadmapStage[] = [
    {
      id: 1,
      title: "Orientation",
      weeks: "Week 1",
      description: "Orientation/Training, observe in a classroom with a 'buddy'",
      color: "bg-red-500 text-white",
      completed: completedStages.includes(1),
      current: currentStage === 1
    },
    {
      id: 2,
      title: "Registry Training",
      weeks: "Week 2",
      description: "Complete AZ Registry Trainings in CCEI",
      color: "bg-pink-500 text-white",
      completed: completedStages.includes(2),
      current: currentStage === 2
    },
    {
      id: 3,
      title: "Find Your Groove",
      weeks: "Week 3",
      description: "Find your groove in the class you're in. Complete Foundations 1 training in AZ Registry.",
      color: "bg-purple-500 text-white",
      completed: completedStages.includes(3),
      current: currentStage === 3
    },
    {
      id: 4,
      title: "Licensing Rules",
      weeks: "Weeks 4-6",
      description: "Know and follow all Licensing rules & regs in the classroom & outside",
      color: "bg-teal-500 text-white",
      completed: completedStages.includes(4),
      current: currentStage === 4
    },
    {
      id: 5,
      title: "Mindfulness",
      weeks: "Weeks 7-10",
      description: "Demonstrate Mindfulness Knowledge in the classroom & with yourself",
      color: "bg-violet-500 text-white",
      completed: completedStages.includes(5),
      current: currentStage === 5
    },
    {
      id: 6,
      title: "Quality First",
      weeks: "Weeks 11-14",
      description: "Demonstrate Quality First practices in the classroom & outside",
      color: "bg-blue-500 text-white",
      completed: completedStages.includes(6),
      current: currentStage === 6
    },
    {
      id: 7,
      title: "Practice All Skills",
      weeks: "Weeks 15-19",
      description: "Practice everything you've been learning",
      color: "bg-green-500 text-white",
      completed: completedStages.includes(7),
      current: currentStage === 7
    },
    {
      id: 8,
      title: "Assessment Prep",
      weeks: "Weeks 20-24",
      description: "Prepare for your first Quality First Practice Assessment",
      color: "bg-yellow-500 text-black",
      completed: completedStages.includes(8),
      current: currentStage === 8
    },
    {
      id: 9,
      title: "Review Results",
      weeks: "Weeks 25-26",
      description: "Review results of your practice assessment and continue to improve",
      color: "bg-orange-500 text-white",
      completed: completedStages.includes(9),
      current: currentStage === 9
    },
    {
      id: 10,
      title: "Final Test",
      weeks: "Week 27",
      description: "You're ready to take the lead teacher test!",
      color: "bg-emerald-600 text-white",
      completed: completedStages.includes(10),
      current: currentStage === 10
    }
  ];

  const currentRoadmapStage = roadmapStages.find(stage => stage.id === currentStage) || roadmapStages[0];
  const progressPercent = Math.min(((completedStages.length) / roadmapStages.length) * 100, 100);
  
  return (
    <Card className="w-full shadow-lg border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">Teacher Development Path</CardTitle>
            <CardDescription className="mt-1">
              Track your progress toward becoming a Master Lead Teacher
            </CardDescription>
          </div>
          <Badge className={cn(
            "px-3 py-1.5 text-sm font-medium",
            userLevel === "Master Lead Teacher" ? "bg-gradient-to-r from-amber-500 to-yellow-300 text-black" : 
            userLevel === "Lead Teacher" ? "bg-blue-600" :
            userLevel === "Associate Teacher" ? "bg-violet-600" :
            userLevel === "Assistant Teacher" ? "bg-teal-600" :
            "bg-primary"
          )}>
            {userLevel}
          </Badge>
        </div>
        
        <div className="mt-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Teacher in Training</span>
          <span>Master Lead Teacher</span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Stage</TabsTrigger>
            <TabsTrigger value="roadmap">My Roadmap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                currentRoadmapStage.color
              )}>
                {currentRoadmapStage.id}
              </div>
              <div>
                <h3 className="font-bold text-lg">{currentRoadmapStage.title}</h3>
                <p className="text-sm font-medium text-muted-foreground">{currentRoadmapStage.weeks}</p>
              </div>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-lg">
              <p>{currentRoadmapStage.description}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {completedStages.length} of {roadmapStages.length} stages completed
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Full Roadmap</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Raising Arizona Lead Teacher Roadmap</DialogTitle>
                    <DialogDescription>
                      Follow this road map for a path to success. After 6 months you are eligible to take Raising Arizona's 100 Question Lead Teacher Test.
                      You will earn an official Master Teacher certification and receive a $1.00 raise on the next payroll!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 overflow-auto max-h-[70vh]">
                    <img 
                      src={roadmapImage} 
                      alt="Lead Teacher Roadmap" 
                      className="w-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          
          <TabsContent value="roadmap" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roadmapStages.map((stage) => (
                <div 
                  key={stage.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-center gap-3",
                    stage.completed ? "border-green-500 bg-green-50" : 
                    stage.current ? "border-primary bg-primary/5" : 
                    "border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-base font-bold",
                    stage.color
                  )}>
                    {stage.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{stage.title}</h4>
                    <p className="text-xs text-muted-foreground">{stage.weeks}</p>
                  </div>
                  {stage.completed && (
                    <div className="text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}