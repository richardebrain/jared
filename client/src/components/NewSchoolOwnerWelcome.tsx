import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  UserPlus, 
  Mail, 
  Settings, 
  Building2, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface NewSchoolOwnerWelcomeProps {
  schoolName?: string;
  teacherCount?: number;
  hasCompletedSetup?: boolean;
}

export default function NewSchoolOwnerWelcome({ 
  schoolName = "Your School", 
  teacherCount = 0,
  hasCompletedSetup = false 
}: NewSchoolOwnerWelcomeProps) {
  const setupSteps = [
    {
      id: 'invite-teachers',
      title: 'Invite Your Teachers',
      description: 'Send email invitations to your teaching staff',
      icon: Mail,
      href: '/invite-teachers',
      completed: teacherCount > 0
    },
    {
      id: 'school-settings',
      title: 'Customize School Settings',
      description: 'Set up your school information and branding',
      icon: Settings,
      href: '/school-settings',
      completed: hasCompletedSetup
    },
    {
      id: 'view-dashboard',
      title: 'Monitor Progress',
      description: 'Track teacher development and engagement',
      icon: Building2,
      href: '/school-dashboard',
      completed: true
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const totalSteps = setupSteps.length;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Welcome to {schoolName}!
        </CardTitle>
        <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
          You're all set up! Let's get your teachers started on their professional development journey.
        </CardDescription>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress: {completedSteps}/{totalSteps}
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {Math.round((completedSteps / totalSteps) * 100)}% Complete
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button 
            size="lg" 
            className="h-auto p-4 bg-primary hover:bg-primary/90"
            asChild
          >
            <Link href="/invite-teachers">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Invite Teachers</div>
                  <div className="text-sm opacity-90">Send bulk email invitations</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </div>
            </Link>
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            className="h-auto p-4 border-primary text-primary hover:bg-primary hover:text-white"
            asChild
          >
            <Link href="/school-settings">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">School Settings</div>
                  <div className="text-sm opacity-90">Customize your school</div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </div>
            </Link>
          </Button>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Getting Started Checklist</h3>
          {setupSteps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                step.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-primary/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                step.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{step.title}</div>
                <div className="text-sm text-gray-600">{step.description}</div>
              </div>
              {step.completed ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={step.href}>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips for New School Owners</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Start by inviting your teachers - they'll receive email invitations to create accounts</li>
            <li>• Customize your school settings to match your branding and values</li>
            <li>• Monitor teacher progress and engagement through the dashboard</li>
            <li>• Teachers can access professional development modules and track their ECE hours</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 