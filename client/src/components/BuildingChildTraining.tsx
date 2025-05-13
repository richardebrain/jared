import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Brick, Clock, Heart, Star, Zap, ArrowLeft, Trophy, Award, Coins } from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';

// Custom LEGO brick icon
const LegoBrick = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="8" width="18" height="10" rx="1" />
    <rect x="6" y="5" width="3" height="3" rx="0.5" />
    <rect x="11" y="5" width="3" height="3" rx="0.5" />
    <rect x="16" y="5" width="3" height="3" rx="0.5" />
  </svg>
);

interface Section {
  title: string;
  content: React.ReactNode;
  legoColor: string;
  points: number;
}

export default function BuildingChildTraining() {
  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // Module ID for "Building a Child: Block by Block"
  // This should match the ID in the database
  const moduleId = 14; // This should be updated to the actual ID
  
  // Fetch user data for points tracking
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch module progress
  const { data: userProgress } = useQuery({
    queryKey: [`/api/progress/${moduleId}`],
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { moduleId: number, progress: number, completed: boolean, pointsEarned?: number }) => {
      return apiRequest('/api/progress', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });
  
  // Update user points directly
  const updateUserPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      return apiRequest('/api/users/add-points', {
        method: 'POST',
        data: { points }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });
  
  // Define the training sections with LEGO theme
  const sections: Section[] = [
    {
      title: "The Foundation Blocks",
      content: (
        <div className="space-y-4 text-lg">
          <p>Every child's life story starts with foundation blocks. Just like building with LEGOs, the first pieces form the base for everything that comes after.</p>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 my-6">
            <h3 className="font-semibold text-amber-800 flex items-center">
              <LegoBrick className="mr-2 text-amber-500" /> Foundation Block Concept
            </h3>
            <p className="mt-2">As teachers, our words and actions are the foundation blocks that children build upon. The stronger and more positive these blocks, the more stable the child's future development will be.</p>
          </div>
          
          <p>In a child's early years, these foundation blocks include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Trust and security</li>
            <li>Sense of self-worth</li>
            <li>Understanding of emotions</li>
            <li>Basic social skills</li>
            <li>Language development</li>
          </ul>
          
          <p className="italic text-muted-foreground mt-4">"The words we speak become the house a child lives in." - Rachel Naomi Remen</p>
        </div>
      ),
      legoColor: "amber",
      points: 5
    },
    {
      title: "Building Block by Block",
      content: (
        <div className="space-y-4 text-lg">
          <p>Each interaction with a child adds another block to their life story. These blocks can be sturdy and beautiful, or unstable and misaligned.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 flex items-center">
                <LegoBrick className="mr-2 text-green-500" /> Positive Blocks
              </h3>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Words of encouragement</li>
                <li>Patient responses</li>
                <li>Showing genuine interest</li>
                <li>Celebrating effort, not just success</li>
                <li>Respecting their feelings</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 flex items-center">
                <LegoBrick className="mr-2 text-red-500" /> Unstable Blocks
              </h3>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Harsh criticism</li>
                <li>Dismissing emotions</li>
                <li>Comparing to other children</li>
                <li>Focusing only on mistakes</li>
                <li>Inconsistent responses</li>
              </ul>
            </div>
          </div>
          
          <p>The blocks we add every day might seem small in the moment, but they accumulate to create the structure of a child's self-concept and worldview.</p>
          
          <p className="italic text-muted-foreground mt-4">"Children are not things to be molded, but people to be unfolded." - Jess Lair</p>
        </div>
      ),
      legoColor: "green",
      points: 10
    },
    {
      title: "Creating a Beautiful Chapter One",
      content: (
        <div className="space-y-4 text-lg">
          <p>As educators at Raising Arizona, we have the privilege and responsibility of helping write "Chapter One" in a child's life story. This chapter forms the foundation for all future chapters.</p>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 my-6">
            <h3 className="font-semibold text-purple-800 flex items-center">
              <LegoBrick className="mr-2 text-purple-500" /> The Chapter One Blueprint
            </h3>
            <p className="mt-2">A beautiful Chapter One includes consistent messaging that tells the child:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>"You are safe here"</li>
              <li>"Your feelings matter"</li>
              <li>"Mistakes help you learn"</li>
              <li>"You have unique gifts to share"</li>
              <li>"You belong in this community"</li>
            </ul>
          </div>
          
          <p>When we consciously build with positive blocks, we create a chapter filled with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-semibold">Security</span> - The foundation for all learning and growth</li>
            <li><span className="font-semibold">Curiosity</span> - The engine that drives exploration and discovery</li>
            <li><span className="font-semibold">Resilience</span> - The ability to bounce back from challenges</li>
            <li><span className="font-semibold">Connection</span> - The sense of belonging and being valued</li>
          </ul>
          
          <p className="italic text-muted-foreground mt-4">"The way we talk to our children becomes their inner voice." - Peggy O'Mara</p>
        </div>
      ),
      legoColor: "purple",
      points: 10
    },
    {
      title: "Practical Application",
      content: (
        <div className="space-y-4 text-lg">
          <p>Let's put these concepts into practice with specific strategies for building positive blocks in your classroom:</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 my-6">
            <h3 className="font-semibold text-blue-800 flex items-center">
              <LegoBrick className="mr-2 text-blue-500" /> Daily Building Strategies
            </h3>
            <ul className="mt-2 list-disc pl-6 space-y-2">
              <li><span className="font-semibold">Morning Greeting Block</span> - Welcome each child by name with genuine warmth</li>
              <li><span className="font-semibold">Narrative Block</span> - Point out when you see positive behaviors: "I noticed how you helped your friend"</li>
              <li><span className="font-semibold">Reflection Block</span> - Ask open questions about their feelings and experiences</li>
              <li><span className="font-semibold">Connection Block</span> - Share brief 1:1 moments with each child every day</li>
              <li><span className="font-semibold">Celebration Block</span> - Acknowledge effort and progress, not just end results</li>
            </ul>
          </div>
          
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 my-6">
            <h3 className="font-semibold text-teal-800 flex items-center">
              <LegoBrick className="mr-2 text-teal-500" /> Block Repair Strategies
            </h3>
            <p className="mt-2">When negative interactions happen (and they will):</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Acknowledge the impact of your words or actions</li>
              <li>Apologize specifically for what happened</li>
              <li>Explain your intention and what you'll do differently</li>
              <li>Add extra positive blocks afterward to rebuild trust</li>
            </ul>
          </div>
          
          <p>Remember: We are not just teaching academic content; we are helping children build the foundation of their life story, block by block, word by word.</p>
          
          <p className="italic text-muted-foreground mt-4">"Every child deserves a champion—an adult who will never give up on them, who understands the power of connection, and insists that they become the best that they can possibly be." - Rita Pierson</p>
        </div>
      ),
      legoColor: "blue",
      points: 10
    },
    {
      title: "Reflection and Commitment",
      content: (
        <div className="space-y-4 text-lg">
          <p>As we conclude this module, take a moment to reflect on your own role in building children's stories:</p>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 my-6">
            <h3 className="font-semibold text-indigo-800 flex items-center">
              <LegoBrick className="mr-2 text-indigo-500" /> Personal Reflection
            </h3>
            <ul className="mt-2 list-disc pl-6 space-y-3">
              <li>What "blocks" do you most consistently add to children's lives?</li>
              <li>Are there any "blocks" you'd like to use less frequently?</li>
              <li>How can you be more intentional about the story you're helping to write?</li>
              <li>What's one specific change you can make tomorrow?</li>
            </ul>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 my-6">
            <h3 className="font-semibold text-emerald-800 flex items-center mb-2">
              <Trophy className="h-5 w-5 text-emerald-500 mr-2" /> Key Takeaways
            </h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Every interaction with a child is a "block" in their life story</li>
              <li>Positive blocks build a secure foundation for future growth</li>
              <li>As teachers, we have the privilege of helping create "Chapter One"</li>
              <li>Small, daily interactions have cumulative power</li>
              <li>We can repair damage by acknowledging mistakes and adding extra positive blocks</li>
            </ol>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-purple-50 p-4 rounded-lg border border-amber-200 mt-8">
            <p className="text-center font-semibold text-lg">
              "Remember: You are not just teaching a child for a day, a week, or a year. You are helping to build a person who will carry your blocks with them for a lifetime."
            </p>
          </div>
        </div>
      ),
      legoColor: "indigo",
      points: 15
    }
  ];
  
  // Handle section completion
  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      // Move to next section
      const newSectionIndex = currentSection + 1;
      setCurrentSection(newSectionIndex);
      
      // Calculate progress percentage
      const newProgress = Math.floor(((newSectionIndex + 1) / sections.length) * 100);
      setProgress(newProgress);
      
      // Add points for the completed section
      const pointsForSection = sections[currentSection].points;
      setPointsEarned(prev => prev + pointsForSection);
      
      // Update progress in the database
      updateProgressMutation.mutate({
        moduleId,
        progress: newProgress,
        completed: false
      });
      
      // Show toast for points earned
      toast({
        title: `🧱 Section Complete!`,
        description: `You've earned ${pointsForSection} points for completing this section.`,
      });
      
    } else {
      // Complete the final section
      handleCompleteTraining();
    }
  };
  
  // Handle training completion
  const handleCompleteTraining = () => {
    // Add points for the last section
    const pointsForLastSection = sections[currentSection].points;
    const totalPoints = pointsEarned + pointsForLastSection;
    
    setPointsEarned(totalPoints);
    setProgress(100);
    setCompleted(true);
    setShowConfetti(true);
    
    // Update progress in the database
    updateProgressMutation.mutate({
      moduleId,
      progress: 100,
      completed: true,
      pointsEarned: totalPoints
    }, {
      onSuccess: () => {
        // Also update user points
        updateUserPointsMutation.mutate(totalPoints);
      }
    });
    
    toast({
      title: "🎉 Training Complete!",
      description: `Congratulations! You've earned ${totalPoints} points for completing "Building a Child: Block by Block"`,
    });
  };
  
  // Initialize progress from saved data if available
  useEffect(() => {
    if (userProgress) {
      setProgress(userProgress.progress || 0);
      
      // If the module was already completed
      if (userProgress.completed) {
        setCompleted(true);
        
        // Calculate which section to show based on saved progress
        const sectionIndex = Math.min(
          Math.floor((userProgress.progress / 100) * sections.length),
          sections.length - 1
        );
        setCurrentSection(sectionIndex);
        
        if (userProgress.pointsEarned) {
          setPointsEarned(userProgress.pointsEarned);
        }
      } else if (userProgress.progress > 0) {
        // If module was partially completed
        const sectionIndex = Math.min(
          Math.floor((userProgress.progress / 100) * sections.length),
          sections.length - 1
        );
        setCurrentSection(sectionIndex);
      }
    }
  }, [userProgress]);
  
  const currentSectionData = sections[currentSection];
  const legoColor = currentSectionData.legoColor;
  
  return (
    <div className="container py-4 max-w-5xl">
      {showConfetti && <Confetti />}
      
      {/* Header with progress and points */}
      <div className={`bg-gradient-to-r from-${legoColor}-50 to-${legoColor}-100 p-4 rounded-lg mb-6 shadow-sm border border-${legoColor}-200`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <div className={`bg-white p-2 rounded-full shadow-sm`}>
              <LegoBrick className={`h-6 w-6 text-${legoColor}-500`} />
            </div>
            <div className="ml-3">
              <h1 className="font-bold text-xl">Building a Child: Block by Block</h1>
              <p className="text-sm text-muted-foreground">Writing a beautiful "Chapter One" in each child's life</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Coins className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <span className="font-bold text-lg">{(user?.points || 0) + pointsEarned}</span>
              <span className="text-muted-foreground ml-1">points</span>
            </div>
            {pointsEarned > 0 && (
              <div className="ml-2 bg-green-100 px-2 py-1 rounded-full text-green-700 text-xs font-semibold animate-pulse">
                +{pointsEarned} earned
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
      </div>
      
      {/* Main content card */}
      <Card className={`border-${legoColor}-200 mb-6`}>
        <CardHeader className={`bg-${legoColor}-50 border-b border-${legoColor}-100`}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <LegoBrick className={`mr-2 text-${legoColor}-500`} />
              {currentSectionData.title}
            </CardTitle>
            <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
              Section {currentSection + 1} of {sections.length}
            </span>
          </div>
          <CardDescription>
            LEGO-themed exploration of how we build a child's story, block by block
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {currentSectionData.content}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          {completed ? (
            <Button className="w-full" disabled>
              <Trophy className="mr-2 h-4 w-4" />
              Training Completed
            </Button>
          ) : (
            <Button 
              className={`w-full bg-${legoColor}-500 hover:bg-${legoColor}-600`}
              onClick={handleNextSection}
              disabled={updateProgressMutation.isPending}
            >
              {currentSection < sections.length - 1 ? (
                <>Continue to Next Section</>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Complete Training
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Quick info card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Zap className="h-5 w-5 text-amber-500 mr-2" />
            Quick Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">What You'll Learn</h3>
              <p className="text-sm text-muted-foreground">
                How your daily interactions with children form the building blocks of their life story and self-concept.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Time Required</h3>
              <p className="text-sm text-muted-foreground">
                60 minutes to complete all sections
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Why This Matters</h3>
              <p className="text-sm text-muted-foreground">
                As educators, we help write "Chapter One" in a child's life story - a foundation that will influence all future chapters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}