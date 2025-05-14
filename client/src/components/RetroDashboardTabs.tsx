import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniLessons } from "@/components/MiniLessons";
import { Award, Trophy, Gamepad } from "lucide-react";

interface RetroDashboardTabsProps {
  children?: React.ReactNode;
}

export function RetroDashboardTabs({ children }: RetroDashboardTabsProps) {
  const { playTabSelectSound } = useSoundEffects();
  
  return (
    <div className="mb-6">
      <Tabs defaultValue="learning" className="retro-tabs">
        <TabsList className="retro-tab-list w-full justify-start mb-2">
          <TabsTrigger 
            value="learning" 
            className="retro-tab"
            onClick={() => playTabSelectSound()}
          >
            My Learning
          </TabsTrigger>
          
          <TabsTrigger 
            value="achievements" 
            className="retro-tab"
            onClick={() => playTabSelectSound()}
          >
            Achievements
          </TabsTrigger>
          
          <TabsTrigger 
            value="activities" 
            className="retro-tab"
            onClick={() => playTabSelectSound()}
          >
            Activities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning" className="retro-tab-content">
          {children}
        </TabsContent>
        
        <TabsContent value="achievements" className="retro-tab-content">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-amber-500" />
                <CardTitle>My Achievements</CardTitle>
              </div>
              <CardDescription>Track your progress and earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-yellow-100 to-amber-100 border border-amber-200 rounded-lg mb-2">
                  <Trophy className="h-16 w-16 text-amber-500 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-amber-800 mb-2">Achievement Unlocked!</h3>
                <p className="text-sm text-amber-700">Complete more training modules to earn achievements and unlock new rewards.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="retro-tab-content">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Award className="h-6 w-6 mr-2 text-indigo-500" />
                <CardTitle>Fun Activities</CardTitle>
              </div>
              <CardDescription>Interactive activities to boost your teaching skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 rounded-lg mb-2">
                  <Award className="h-16 w-16 text-indigo-500 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-indigo-800 mb-2">Interactive Games Coming Soon!</h3>
                <p className="text-sm text-indigo-700">Hands-on activities and games to help reinforce your learning will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}