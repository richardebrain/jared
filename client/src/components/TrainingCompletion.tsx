import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Trophy, BookOpen, Video, Target, Users, Wrench, Star, Plus } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface TrainingCompletionProps {
  onContinue: () => void;
}

export default function TrainingCompletion({ onContinue }: TrainingCompletionProps) {
  const [currentTab, setCurrentTab] = useState("points");
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const { playCelebrationSound } = useSoundEffects();
  
  // Play victory sound when component mounts
  useEffect(() => {
    // Play sound with slight delay to ensure it loads properly
    const timer = setTimeout(() => {
      playCelebrationSound();
      setShowPointsAnimation(true);
      
      // Hide the animation after a few seconds
      setTimeout(() => {
        setShowPointsAnimation(false);
      }, 3000);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [playCelebrationSound]);
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8 relative">
        <div className="inline-block p-5 bg-gradient-to-br from-yellow-50 to-amber-100 rounded-full mb-6 shadow-inner">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        
        {/* Points animation overlay */}
        {showPointsAnimation && (
          <div className="absolute top-0 right-0 left-0 flex justify-center">
            <div className="animate-bounce-slide-up flex items-center bg-yellow-100 px-4 py-2 rounded-full shadow-lg border border-yellow-300">
              <Plus className="h-5 w-5 text-yellow-600 mr-1" />
              <span className="text-xl font-bold text-yellow-600">50 points!</span>
            </div>
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Congratulations!
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          You've successfully completed Raising Arizona's CORE Values training. 
          <span className="font-semibold"> You've earned 50 points!</span> Now, let's explore how to continue your growth journey.
        </p>
      </div>
      
      <Tabs defaultValue="points" className="mb-8" onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="points" onClick={() => setCurrentTab("points")}>
            <Star className="h-4 w-4 mr-2" />
            <span>Points System</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" onClick={() => setCurrentTab("leaderboard")}>
            <Trophy className="h-4 w-4 mr-2" />
            <span>Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="trainings" onClick={() => setCurrentTab("trainings")}>
            <Target className="h-4 w-4 mr-2" />
            <span>Trainings</span>
          </TabsTrigger>
          <TabsTrigger value="tools" onClick={() => setCurrentTab("tools")}>
            <Wrench className="h-4 w-4 mr-2" />
            <span>Teacher Tools</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="points" className="space-y-6">
          <Card className="transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-orange-700 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Points System: Your Path to Master Lead Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h3 className="font-bold text-orange-800 mb-2">How to Earn Points</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="bg-white p-1 rounded-full shadow">
                      <Video className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <span className="font-medium">Training Videos:</span> 
                      <span className="text-sm"> 5 points for videos under 10 minutes, 8 points for longer videos (limit 2 per day)</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-white p-1 rounded-full shadow">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <span className="font-medium">Mini-Lessons:</span> 
                      <span className="text-sm"> 15 points per lesson, includes quiz and implementation activities</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-white p-1 rounded-full shadow">
                      <Users className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <span className="font-medium">Peer Collaboration:</span> 
                      <span className="text-sm"> 10 points for leading a discussion or sharing resources</span>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-white p-1 rounded-full shadow">
                      <Award className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <span className="font-medium">Core Module Completion:</span> 
                      <span className="text-sm"> 50 points for completing the full Core Values training</span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4">Teacher Levels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="font-semibold text-blue-700 mb-1">Novice Teacher</div>
                    <div className="text-sm text-gray-600">0-100 points</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="font-semibold text-blue-700 mb-1">Associate Teacher</div>
                    <div className="text-sm text-gray-600">101-250 points</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="font-semibold text-blue-700 mb-1">Lead Teacher</div>
                    <div className="text-sm text-gray-600">251-500 points</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="font-semibold text-blue-700 mb-1">Senior Lead Teacher</div>
                    <div className="text-sm text-gray-600">501-750 points</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="font-semibold text-blue-700 mb-1">Expert Lead Teacher</div>
                    <div className="text-sm text-gray-600">751-1000 points</div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow-sm border border-yellow-100">
                    <div className="font-semibold text-amber-700 mb-1">Master Lead Teacher</div>
                    <div className="text-sm text-amber-600">1000+ points</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-blue-500" />
                Leaderboard: Top Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4">Monthly Leaders</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold">1</div>
                    <div className="flex-1">
                      <div className="font-medium">Jennifer Adams</div>
                      <div className="text-sm text-gray-500">Expert Lead Teacher</div>
                    </div>
                    <div className="font-bold text-amber-500">892 pts</div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold">2</div>
                    <div className="flex-1">
                      <div className="font-medium">Michael Chen</div>
                      <div className="text-sm text-gray-500">Senior Lead Teacher</div>
                    </div>
                    <div className="font-bold text-blue-500">705 pts</div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold">3</div>
                    <div className="flex-1">
                      <div className="font-medium">Sarah Johnson</div>
                      <div className="text-sm text-gray-500">Senior Lead Teacher</div>
                    </div>
                    <div className="font-bold text-blue-500">680 pts</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-700">
                  The leaderboard resets on the 1st of each month. Monthly winners receive special recognition and perks like priority access to new trainings and exclusive resources.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trainings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-purple-700 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-500" />
                Personalized Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                <h3 className="font-bold text-purple-800 mb-2">Recommended Training Modules</h3>
                <p className="text-gray-700 mb-3">
                  Based on your assessment results, we've curated a personalized learning path to help you grow in your areas of opportunity while leveraging your strengths.
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-50 flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Classroom Management Strategies</div>
                      <div className="text-sm text-gray-500">15 points • 3 videos • 1 mini-lesson</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                      View
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-50 flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Child Development Milestones</div>
                      <div className="text-sm text-gray-500">15 points • 4 videos • 2 mini-lessons</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                      View
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-50 flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Engaging Parents as Partners</div>
                      <div className="text-sm text-gray-500">15 points • 2 videos • 1 mini-lesson</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                      View
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Mini-Lessons & Video Library</h3>
                <p className="text-gray-700">
                  Explore our comprehensive library of videos and mini-lessons covering a wide range of early childhood education topics. Each mini-lesson includes quizzes and practical activities for implementation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-green-700 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-green-500" />
                Teacher Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Peer Collaboration
                  </h3>
                  <p className="text-gray-700 mb-2">
                    Connect with fellow teachers to share ideas, resources, and best practices. Lead discussions to earn additional points.
                  </p>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 mt-2">
                    Open Forums
                  </Button>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center">
                    <div className="mr-2">🎮</div>
                    CORE Values Shout Out!
                  </h3>
                  <p className="text-gray-700 mb-2">
                    Test your knowledge of the CORE values with this fun, interactive game that helps reinforce your learning.
                  </p>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 mt-2">
                    Play Game
                  </Button>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Growth Assessment
                  </h3>
                  <p className="text-gray-700 mb-2">
                    Take regular assessments to track your progress and receive updated learning recommendations.
                  </p>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 mt-2">
                    Start Assessment
                  </Button>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Resource Library
                  </h3>
                  <p className="text-gray-700 mb-2">
                    Access a wide range of printable resources, classroom materials, and curriculum guides.
                  </p>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 mt-2">
                    Browse Resources
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => {
            playCelebrationSound();
            // Scroll to top before continuing
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Small delay to allow smooth scrolling before transition
            setTimeout(() => {
              onContinue();
            }, 300);
          }}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}