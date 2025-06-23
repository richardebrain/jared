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

// Import existing screenshots for enhanced tutorial
import dashboardScreenshot from "@assets/Screenshot 2025-06-14 at 22.03.36_1749935018429.png";
import assessmentScreenshot from "@assets/Screenshot 2025-06-15 at 14.38.41_1749994726716.png";
import directorToolkitScreenshot from "@assets/Screenshot 2025-06-14 at 16.11.11_1749913887467.png";
import teacherManagementScreenshot from "@assets/Screenshot 2025-06-14 at 22.03.17_1749935001943.png";
import videoLibraryScreenshot from "@assets/Screenshot 2025-06-14 at 12.29.16_1749900559890.png";
import eceTrackingScreenshot from "@assets/Screenshot 2025-06-15 at 14.39.44_1749994787827.png";

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MentorMe ECE',
    description: 'Transform your teaching with quick, engaging professional development! Only have 15 minutes? Perfect! Earn ECE hours while having fun, climb the teacher ranks, and discover tools that make your classroom magical.',
    icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
    screenshot: dashboardScreenshot,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'dashboard',
    title: 'Your Progression Dashboard',
    description: 'Watch yourself climb from Assistant to Master Teacher! See exactly how many points you earn for each activity and track your ECE hours. Your dashboard shows your rank progress, streak rewards, and the path to your next level!',
    icon: <BarChart3 className="h-6 w-6 text-green-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'View Dashboard',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'modules',
    title: 'Lightning Training Modules',
    description: 'Only have 15 minutes for training? Take 4 lightning trainings to earn 1 full ECE hour! Quick, engaging modules that fit your busy schedule. Earn points, climb ranks, and watch videos for extra rewards!',
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'Browse Modules',
      href: '/modules'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'assessment',
    title: 'Adaptive Assessments',
    description: 'Take skill assessments that adapt to your knowledge level and provide personalized learning recommendations based on your performance.',
    icon: <Target className="h-6 w-6 text-orange-600" />,
    screenshot: assessmentScreenshot,
    action: {
      text: 'Start Assessment',
      href: '/assessment'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'ece-tracking',
    title: 'ECE Hours Tracking',
    description: 'Automatically track your professional development hours for ECE compliance. View your progress toward certification requirements.',
    icon: <Clock className="h-6 w-6 text-emerald-600" />,
    screenshot: eceTrackingScreenshot,
    action: {
      text: 'View ECE Progress',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'points-system',
    title: 'Points & Achievements',
    description: 'Earn points for completing modules and assessments. Build learning streaks and unlock achievements as you progress in your professional development.',
    icon: <Award className="h-6 w-6 text-yellow-600" />,
    screenshot: dashboardScreenshot,
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'music-library',
    title: 'Classroom Music Library',
    description: 'Need calming music for nap time? Energizing songs for transitions? Browse our curated music library designed specifically for early childhood classrooms. Make every moment magical with the perfect soundtrack!',
    icon: <Music className="h-6 w-6 text-purple-600" />,
    screenshot: videoLibraryScreenshot,
    action: {
      text: 'Browse Music',
      href: '/games'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'video-library',
    title: 'Professional Video Library',
    description: 'Watch videos and earn points! Professional development videos with integrated quizzes that count toward your ECE hours. Rate boring content low so we can remove it - we want only the best training over time!',
    icon: <Play className="h-6 w-6 text-red-600" />,
    screenshot: videoLibraryScreenshot,
    action: {
      text: 'Browse Videos',
      href: '/videos'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'director-toolkit',
    title: 'Director Toolkit',
    description: 'Access powerful administrative tools including teacher management, ECE tracking, Perfect Manager coaching system, and comprehensive reporting.',
    icon: <Settings className="h-6 w-6 text-indigo-600" />,
    screenshot: directorToolkitScreenshot,
    action: {
      text: 'Open Director Toolkit',
      href: '/admin'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'teacher-management',
    title: 'Teacher Profiles & Progress',
    description: 'Monitor your team\'s professional development, track ECE hours, generate certificates, and manage user roles and permissions.',
    icon: <Users className="h-6 w-6 text-cyan-600" />,
    screenshot: eceTrackingScreenshot,
    action: {
      text: 'Manage Teachers',
      href: '/admin/teachers'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'perfect-manager',
    title: 'Perfect Manager AI Coach',
    description: 'Get personalized leadership coaching for challenging workplace situations. AI-powered advice from top leadership experts for ECE directors.',
    icon: <MessageSquare className="h-6 w-6 text-pink-600" />,
    screenshot: directorToolkitScreenshot,
    action: {
      text: 'Try Perfect Manager',
      href: '/admin/perfect-manager'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'module-creator',
    title: 'Create Custom Modules',
    description: 'Build your own training modules using AI assistance, manual creation, or PowerPoint import. Share with your team or the community.',
    icon: <Zap className="h-6 w-6 text-violet-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'Create Module',
      href: '/new-module-creator'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'custom-story-creator',
    title: 'Custom Story Creator',
    description: 'Have a child who doesn\'t speak English? Create comfort stories in their language to help with biting, transitions, or any classroom challenge! Personalized stories that speak to each child\'s heart in their home language.',
    icon: <BookOpen className="h-6 w-6 text-pink-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'Create Story',
      href: '/games'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'suessifier',
    title: 'The Suessifier',
    description: 'Want a fun poem with your student\'s name? Test the Suessifier! Create personalized Dr. Seuss-style poems that make every child feel special. Perfect for circle time, transitions, or celebrating achievements!',
    icon: <Music className="h-6 w-6 text-orange-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'Create Poem',
      href: '/games'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'core-values-shoutouts',
    title: 'Core Value Shout-Outs',
    description: 'Celebrate your team! Give core value shout-outs to employees who embody your school\'s values. Build positive culture while earning points and climbing the leaderboard. Recognition that matters!',
    icon: <Award className="h-6 w-6 text-green-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'Give Shout-Out',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'leaderboard',
    title: 'Get on Top of the Leaderboard',
    description: 'Compete with your colleagues! See who\'s earning the most points, completing the most training, and climbing the teacher ranks. Friendly competition that motivates everyone to grow professionally!',
    icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
    screenshot: dashboardScreenshot,
    action: {
      text: 'View Leaderboard',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'getting-started',
    title: 'Ready to Begin!',
    description: 'You\'re all set to start your professional development journey. Remember to check your dashboard regularly for new recommendations and progress updates.',
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    userTypes: ['teacher', 'admin', 'school_admin']
  }
];

export default function UserTutorial({ isOpen, onClose, userRole }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
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

  const handleSkip = () => {
    completeTutorialMutation.mutate();
    onClose();
  };

  const currentStepData = relevantSteps[currentStep];

  if (!currentStepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {currentStepData.icon}
              {currentStepData.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
              Skip Tutorial
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
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
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            
            {/* Step Information */}
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                    {currentStepData.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentStepData.description}
                    </p>
                  </div>

                  {currentStepData.action && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (currentStepData.action?.href) {
                            window.open(currentStepData.action.href, '_blank');
                          }
                          if (currentStepData.action?.onClick) {
                            currentStepData.action.onClick();
                          }
                        }}
                        className="gap-2"
                      >
                        {currentStepData.action.text}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
              {currentStepData.id === 'ece-tracking' && 
                "ECE hours are automatically tracked when you complete eligible modules - no manual entry needed!"}
              {currentStepData.id === 'director-toolkit' && 
                "The Perfect Manager feature provides AI coaching for challenging workplace situations with your team."}
              {currentStepData.id === 'getting-started' && 
                "Bookmark the dashboard and check it regularly for new module recommendations and progress updates."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
              {currentStep === totalSteps - 1 ? 
                <CheckCircle2 className="h-4 w-4" /> : 
                <ArrowRight className="h-4 w-4" />
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}