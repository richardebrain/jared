import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  BookOpen, 
  Users, 
  Award, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Music, 
  ArrowLeft, 
  X,
  GraduationCap,
  Target,
  Clock,
  Star
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  screenshot?: string;
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  userTypes: ('teacher' | 'admin' | 'school_admin')[];
}

interface UserTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'admin' | 'school_admin';
}

// Import actual screenshots of the platform interface
import signInPageImg from "@assets/Mentor Me Sign in page_1750717282945.png";
import welcomePageImg from "@assets/WELCOME PAGE points, levels etc_1750717282945.png";
import dashboardImg from "@assets/Dashboard_1750717282945.png";
import progressionMapImg from "@assets/Progression Map_1750717282945.png";
import teacherLevelsImg from "@assets/Teacher Levels assistant to master_1750717282945.png";
import teacherToolkitImg from "@assets/Teacher Toolkit_1750717282945.png";
import communityModulesImg from "@assets/Community Modules_1750717282945.png";
import audioLibraryImg from "@assets/Audio Library_1750717282946.png";
import videoLibraryImg from "@assets/Video Library_1750717282946.png";
import coreValuesImg from "@assets/Core Values Shout Out_1750717282946.png";

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MentorMe ECE',
    description: 'Transform your teaching with quick, engaging professional development! Only have 15 minutes? Perfect! Earn ECE hours while having fun, climb the teacher ranks, and discover tools that make your classroom magical.',
    icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
    screenshot: signInPageImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'dashboard',
    title: 'Your Teacher Dashboard',
    description: 'Watch yourself climb from Assistant to Master Teacher! See exactly how many points you earn for each activity and track your ECE hours. Your dashboard shows your rank progress, streak rewards, and the path to your next level!',
    icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
    screenshot: dashboardImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'welcome-streak',
    title: 'Daily Welcome & Streak Tracking',
    description: 'Start each day with a personalized welcome showing your learning streak! Track your points, Bear Bucks, and current level. Your dedication to professional growth is celebrated with daily motivation and streak rewards.',
    icon: <Star className="h-6 w-6 text-yellow-500" />,
    screenshot: welcomePageImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'progression',
    title: 'Teacher Progression Map',
    description: 'Track your journey from Assistant to Master Teacher! See exactly what points and ECE hours you need for your next level. Visual progress bars show both your points and training hour requirements.',
    icon: <Target className="h-6 w-6 text-purple-600" />,
    screenshot: progressionMapImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'teacher-levels',
    title: 'Professional Certification Levels',
    description: 'Explore the five teacher certification levels from Assistant to Master. Each level shows specific requirements including points, assessment scores, training hours, experience, and director approval needed for advancement.',
    icon: <Award className="h-6 w-6 text-blue-600" />,
    screenshot: teacherLevelsImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'teacher-toolkit',
    title: 'AI-Powered Teacher Toolkit',
    description: 'Access powerful teaching tools including parent response generator, lesson plan creator, custom story builder, transition timer, and Suessifier. Plus video library, EduTok tips, and director meeting scheduler.',
    icon: <Settings className="h-6 w-6 text-green-600" />,
    screenshot: teacherToolkitImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'community-modules',
    title: 'Community Learning Modules',
    description: 'Discover top-rated training modules created by fellow educators. Community competition encourages quality content creation with special prizes for top creators. Rate modules to maintain high standards.',
    icon: <Users className="h-6 w-6 text-orange-600" />,
    screenshot: communityModulesImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'audio-library',
    title: 'Music & Audio Library',
    description: 'Access calming nap time music, energizing transition songs, and educational audio content. Perfect for creating the right classroom atmosphere throughout your daily routines.',
    icon: <Music className="h-6 w-6 text-purple-600" />,
    screenshot: audioLibraryImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'video-library',
    title: 'Professional Development Videos',
    description: 'Watch curated professional development videos with integrated quizzes that count toward ECE hours. Videos cover essential topics like child development, classroom management, and teaching strategies.',
    icon: <Play className="h-6 w-6 text-red-600" />,
    screenshot: videoLibraryImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'core-values',
    title: 'Core Values Recognition',
    description: 'Recognize fellow teachers for exemplifying core values like "Be Prepared." Nominate colleagues, share specific examples, and build a positive workplace culture through peer recognition and appreciation.',
    icon: <MessageSquare className="h-6 w-6 text-green-600" />,
    screenshot: coreValuesImg,
    userTypes: ['teacher', 'admin', 'school_admin']
  },

  {
    id: 'getting-started',
    title: 'Ready to Begin!',
    description: 'You\'re all set to start your professional development journey. Remember to check your dashboard regularly for new recommendations and progress updates.',
    icon: <CheckCircle2 className="h-6 w-6 text-purple-500" />,
    userTypes: ['teacher', 'admin', 'school_admin']
  }
];

export default function UserTutorial({ isOpen, onClose, userRole }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [mysteryBoxOpened, setMysteryBoxOpened] = useState(false);
  const [mysteryBoxReward, setMysteryBoxReward] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data for personalized affirmations
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isOpen,
  });

  // Filter steps based on user role
  const relevantSteps = tutorialSteps.filter(step => step.userTypes.includes(userRole));
  const totalSteps = relevantSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Mark tutorial as completed
  const completeTutorialMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/user/complete-tutorial', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Tutorial Completed!",
        description: "Welcome to MentorMe ECE. Start exploring and building your professional development journey.",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      // Award 1 point for tutorial progress and play coin sound
      awardTutorialPoint();
      setCurrentStep(currentStep + 1);
    } else {
      // On the last step, show mystery box instead of completing immediately
      setShowMysteryBox(true);
    }
  };

  // Award points for tutorial progress with sound and personalized affirmations
  const awardTutorialPoint = async () => {
    try {
      await apiRequest('/api/award-tutorial-point', {
        method: 'POST'
      });
      
      // Play coin sound effect
      const audio = new Audio('/coin-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback: create coin sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      });

      // Get user's first name for personalized affirmation
      const firstName = (user as any)?.firstName || (user as any)?.username || 'Amazing Teacher';
      const currentStepData = tutorialSteps.filter(step => step.userTypes.includes(userRole))[currentStep];
      
      // Create personalized affirmations based on the tutorial step
      const getAffirmation = (stepId: string, name: string) => {
        const affirmations: { [key: string]: string } = {
          'welcome': `Congrats ${name}! Now you know the platform basics. Here's a point! You are Amazing!`,
          'modules': `Fantastic ${name}! You've learned about learning modules. Here's a point! You're a Star!`,
          'assessment': `Wonderful ${name}! Now you understand assessments. Here's a point! You Rock!`,
          'ece-tracking': `Excellent ${name}! ECE tracking makes sense now. Here's a point! You're Incredible!`,
          'director-toolkit': `Outstanding ${name}! You've discovered the Director Toolkit. Here's a point! You're Brilliant!`,
          'getting-started': `Perfect ${name}! You're ready to begin your journey. Here's a point! You're Unstoppable!`
        };
        return affirmations[stepId] || `Great job ${name}! Tutorial step complete. Here's a point! You're Awesome!`;
      };

      // Show personalized affirmation notification
      toast({
        title: "🎉 Tutorial Progress!",
        description: getAffirmation(currentStepData.id, firstName),
        duration: 3000,
      });
    } catch (error) {
      console.error('Error awarding tutorial point:', error);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeTutorialMutation.mutate();
    onClose();
  };

  // Open mystery box and award random bonus points
  const openMysteryBox = async () => {
    if (mysteryBoxOpened) return;
    
    try {
      // Generate random bonus points (1-20)
      const bonusPoints = Math.floor(Math.random() * 20) + 1;
      
      // Award the bonus points
      const response = await apiRequest('/api/mystery-box-reward', {
        method: 'POST',
        data: { bonusPoints }
      });
      
      setMysteryBoxReward(bonusPoints);
      setMysteryBoxOpened(true);
      
      // Play special victory sound
      const audio = new Audio('/victory-sound.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Fallback: create victory sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Victory melody
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        let time = audioContext.currentTime;
        
        notes.forEach((freq, index) => {
          oscillator.frequency.setValueAtTime(freq, time + index * 0.2);
        });
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      });

      const firstName = (user as any)?.firstName || (user as any)?.username || 'Amazing Teacher';
      
      // Show exciting reward notification
      toast({
        title: "🎁 Mystery Box Opened!",
        description: `Congratulations ${firstName}! You won ${bonusPoints} bonus points! Your tutorial adventure is complete!`,
        duration: 4000,
      });
      
      // Complete tutorial after short delay
      setTimeout(() => {
        handleComplete();
      }, 4000);
      
    } catch (error) {
      console.error('Error opening mystery box:', error);
      toast({
        title: "Mystery Box Error",
        description: "Something went wrong with your mystery box. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    completeTutorialMutation.mutate();
    onClose();
  };

  const currentStepData = relevantSteps[currentStep];

  if (!currentStepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-4 border-purple-300 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <div className="relative">
                {currentStepData.icon}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
              {currentStepData.title}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-full font-semibold"
            >
              <X className="h-4 w-4" />
              Skip Tutorial
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-purple-600">🎮 Level {currentStep + 1} of {totalSteps}</span>
              <span className="text-pink-600">{Math.round(progress)}% Complete ⭐</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3 bg-gray-200 border-2 border-purple-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                   style={{ width: `${progress}%` }}>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="space-y-4">
            {/* Screenshot Display */}
            {currentStepData.screenshot && (
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <img 
                  src={currentStepData.screenshot} 
                  alt={`${currentStepData.title} interface`}
                  className="w-full h-32 object-contain"
                />
              </div>
            )}
            
            {/* Step Information */}
            <Card className="border-4 border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse border-4 border-yellow-300">
                    <div className="text-white text-2xl">
                      {currentStepData.icon}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {currentStepData.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed font-medium text-lg">
                      {currentStepData.description}
                    </p>
                  </div>


                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role-specific tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {userRole === 'teacher' ? 'Teacher Tip' : 
                 userRole === 'admin' ? 'Administrator Tip' : 
                 'School Admin Tip'}
              </span>
            </div>
            <p className="text-sm text-blue-800">
              {currentStepData.id === 'welcome' && userRole === 'teacher' && 
                "Focus on building your learning streak and tracking ECE hours for professional development requirements."}
              {currentStepData.id === 'welcome' && (userRole === 'admin' || userRole === 'school_admin') && 
                "Use the Director Toolkit to manage your team's professional development and track school-wide progress."}
              {currentStepData.id === 'modules' && 
                "Start with micro modules (5 minutes) for quick learning during busy days, then progress to longer modules."}
              {currentStepData.id === 'assessment' && 
                "Take the initial assessment to get personalized module recommendations based on your current knowledge."}
              {currentStepData.id === 'ece-tracking' && userRole === 'teacher' && 
                "ECE hours are automatically tracked when you complete eligible modules and emailed to your director monthly. Your admin can also add in-person training hours for off-site courses."}
              {currentStepData.id === 'ece-tracking' && (userRole === 'admin' || userRole === 'school_admin') && 
                "Monitor all teachers' ECE progress and manually add in-person training hours through the ECE Hours Tracker in the Director Toolkit."}
              {currentStepData.id === 'director-toolkit' && 
                "The Perfect Manager feature provides AI coaching for challenging workplace situations with your team."}
              {currentStepData.id === 'getting-started' && 
                "Bookmark the dashboard and check it regularly for new module recommendations and progress updates."}
            </p>
          </div>
        </div>

        {/* Mystery Box on Final Step */}
        {currentStep === totalSteps - 1 && showMysteryBox && (
          <div className="mt-6 p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-dashed border-purple-300">
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce">🎁</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Congratulations! You've earned a Mystery Box!
              </h3>
              <p className="text-gray-700 text-lg">
                Click to open your mystery box and discover bonus points to start your journey!
              </p>
              
              {!mysteryBoxOpened ? (
                <Button
                  onClick={openMysteryBox}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  ✨ Open Mystery Box! ✨
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-4xl">🎉</div>
                  <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
                    <div className="text-3xl font-bold text-yellow-600">
                      +{mysteryBoxReward} Bonus Points!
                    </div>
                    <p className="text-gray-600 mt-2">
                      Amazing! You now have {10 + mysteryBoxReward} total points to start your adventure!
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your tutorial will complete automatically in a few seconds...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || showMysteryBox}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {!showMysteryBox && (
              <>
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Tutorial
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  {currentStep === totalSteps - 1 ? 'Get Reward!' : 'Next'}
                  {currentStep === totalSteps - 1 ? 
                    <Star className="h-4 w-4" /> : 
                    <ArrowRight className="h-4 w-4" />
                  }
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}