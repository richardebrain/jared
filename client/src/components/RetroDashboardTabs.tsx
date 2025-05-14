import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { MiniLessons } from "@/components/MiniLessons";
import { Award, Trophy, Star, Book } from "lucide-react";

interface RetroDashboardTabsProps {
  children?: React.ReactNode;
}

export function RetroDashboardTabs({ children }: RetroDashboardTabsProps) {
  const { playTabSelectSound } = useSoundEffects();
  
  return (
    <div className="mb-6">
      <Tabs defaultValue="learning" className="ac-tabs">
        <TabsList className="ac-tab-list">
          <TabsTrigger 
            value="learning" 
            className="ac-tab"
            onClick={() => playTabSelectSound()}
          >
            <span className="relative z-10">My Learning</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="achievements" 
            className="ac-tab"
            onClick={() => playTabSelectSound()}
          >
            <span className="relative z-10">Achievements</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="activities" 
            className="ac-tab"
            onClick={() => playTabSelectSound()}
          >
            <span className="relative z-10">Activities</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="learning" className="ac-tab-content">
          {children}
        </TabsContent>
        
        <TabsContent value="achievements" className="ac-tab-content">
          <div className="ac-card">
            <div className="ac-card-header" style={{background: 'linear-gradient(180deg, #fff8e1 0%, #ffecb3 100%)'}}>
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-3 float-animation" style={{animationDelay: '0.4s'}}>
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="ac-card-title" style={{color: '#ff8f00'}}>My Achievements</h3>
                  <p className="ac-card-description">Track your progress and earn rewards</p>
                </div>
              </div>
            </div>
            <div className="ac-card-content">
              <div className="p-6 text-center">
                <div className="inline-block p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-full mb-4 float-animation">
                  <Trophy className="h-16 w-16 text-amber-500 mx-auto" />
                </div>
                <h3 className="text-lg font-game text-amber-800 mb-3">Achievement Unlocked!</h3>
                <p className="text-[#6e7f80]">Complete more training modules to earn achievements and unlock new rewards.</p>
                
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="relative">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <Trophy className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Coming Soon</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activities" className="ac-tab-content">
          <div className="ac-card">
            <div className="ac-card-header" style={{background: 'linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)'}}>
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3 float-animation">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="ac-card-title">Fun Activities</h3>
                  <p className="ac-card-description">Interactive activities to boost your teaching skills</p>
                </div>
              </div>
            </div>
            <div className="ac-card-content">
              <div className="p-6 text-center">
                <div className="inline-block p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-full mb-4 float-animation" style={{animationDelay: '0.3s'}}>
                  <Award className="h-16 w-16 text-blue-500 mx-auto" />
                </div>
                <h3 className="text-lg font-game text-blue-800 mb-3">Interactive Games Coming Soon!</h3>
                <p className="text-[#6e7f80]">Hands-on activities and games to help reinforce your learning will appear here.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50 flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <Star className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-[#6e7f80] text-sm">Memory Match Game</span>
                  </div>
                  <div className="border-2 border-green-100 rounded-xl p-4 bg-green-50 flex items-center">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-[#6e7f80] text-sm">Classroom Setup Puzzle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}