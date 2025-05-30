import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Wand2, 
  UserPlus, 
  MessageSquare, 
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Mail,
  Target,
  Award,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';

interface ToolkitTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  category: 'staff' | 'content' | 'communication' | 'analytics';
}

const directorTools: ToolkitTool[] = [
  // Staff Management
  {
    id: 'teachers',
    title: 'Teacher Profiles & Progress',
    description: 'View all teacher progress, certifications, and professional development status',
    icon: Users,
    route: '/admin/teachers',
    badge: 'Essential',
    badgeVariant: 'default',
    category: 'staff'
  },
  {
    id: 'module-assigner',
    title: 'Module Assigner',
    description: 'Assign specific training modules and deadlines to individual teachers or groups',
    icon: UserPlus,
    route: '/admin/assign-modules',
    category: 'staff'
  },
  {
    id: 'staff-reports',
    title: 'Staff Analytics',
    description: 'Comprehensive reports on staff performance, completion rates, and trends',
    icon: BarChart3,
    route: '/admin/analytics',
    category: 'analytics'
  },
  
  // Content Creation
  {
    id: 'module-maker-easy',
    title: 'Module Maker (Easy Mode)',
    description: 'Quick module creation with guided templates and pre-built components',
    icon: BookOpen,
    route: '/admin/module-maker',
    badge: 'Popular',
    badgeVariant: 'secondary',
    category: 'content'
  },
  {
    id: 'module-ai-wizard',
    title: 'AI Module Wizard (Advanced)',
    description: 'Advanced AI-powered module creation with custom content generation',
    icon: Wand2,
    route: '/module-wizard',
    badge: 'AI-Powered',
    badgeVariant: 'outline',
    category: 'content'
  },
  {
    id: 'video-library-admin',
    title: 'Video Library Manager',
    description: 'Manage video resources, add custom content, and organize collections',
    icon: FileText,
    route: '/admin/video-library',
    category: 'content'
  },
  
  // Communication
  {
    id: 'staff-messaging',
    title: 'Teacher Messaging',
    description: 'Send announcements, reminders, and personalized messages to your team',
    icon: MessageSquare,
    route: '/admin/messaging',
    category: 'communication'
  },
  {
    id: 'staff-meeting-creator',
    title: 'Staff Meeting Creator',
    description: 'AI-assisted tool to create engaging staff meeting agendas and materials',
    icon: Calendar,
    route: '/admin/meeting-creator',
    badge: 'New',
    badgeVariant: 'destructive',
    category: 'communication'
  },
  {
    id: 'email-campaigns',
    title: 'Email Campaigns',
    description: 'Create and send professional development newsletters and updates',
    icon: Mail,
    route: '/admin/email-campaigns',
    category: 'communication'
  },
  
  // Analytics & Management
  {
    id: 'certification-tracker',
    title: 'Certification Tracker',
    description: 'Monitor upcoming certification expirations and compliance requirements',
    icon: Award,
    route: '/admin/certifications',
    category: 'analytics'
  },
  {
    id: 'goals-tracker',
    title: 'Professional Goals Tracker',
    description: 'Set and monitor professional development goals for your team',
    icon: Target,
    route: '/admin/goals',
    category: 'analytics'
  },
  {
    id: 'school-settings',
    title: 'School Settings',
    description: 'Configure school-wide policies, requirements, and customizations',
    icon: Settings,
    route: '/admin/settings',
    category: 'analytics'
  }
];

const categoryLabels = {
  staff: 'Staff Management',
  content: 'Content Creation',
  communication: 'Communication',
  analytics: 'Analytics & Reports'
};

const categoryColors = {
  staff: 'bg-blue-50 border-blue-200',
  content: 'bg-green-50 border-green-200',
  communication: 'bg-purple-50 border-purple-200',
  analytics: 'bg-orange-50 border-orange-200'
};

export default function DirectorToolkit() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const filteredTools = selectedCategory === 'all' 
    ? directorTools 
    : directorTools.filter(tool => tool.category === selectedCategory);
  
  const toolsByCategory = directorTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolkitTool[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 transition-all duration-300 shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Enhanced Header with Animations */}
          <div className="text-center mb-6 relative">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-xl animate-bounce">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  🎯 Director Toolkit ⚡
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <Sparkles className="h-4 w-4 text-purple-500 animate-spin" />
                  <div className="h-1 w-16 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-xl animate-bounce delay-300">
                <Zap className="h-10 w-10 text-white" />
              </div>
            </div>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-purple-200 shadow-lg">
              🚀 Your <span className="font-bold text-purple-600">command center</span> for managing and growing your team's professional development journey! 
              Choose your mission and unlock powerful administrative tools! ✨
            </p>
          </div>
        </div>

        {/* Enhanced Category Filter */}
        <div className="mb-8 relative">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              🎯 Choose Your Mission
              <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
            </h2>
            <p className="text-gray-600 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg inline-block border border-purple-200 shadow-sm">
              Select a category to unlock specialized administrative tools
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="lg"
              className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm ${
                selectedCategory === 'all' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-xl' 
                  : 'bg-white/80 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              ✨ All Tools
              <Badge variant="secondary" className="ml-2 animate-pulse">{directorTools.length}</Badge>
              {selectedCategory === 'all' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
              )}
            </Button>
            
            {Object.entries(categoryLabels).map(([key, label]) => {
              const categoryConfig = {
                staff: { emoji: '👥', gradient: 'from-blue-600 to-cyan-600', hoverGradient: 'from-blue-700 to-cyan-700' },
                content: { emoji: '📚', gradient: 'from-green-600 to-emerald-600', hoverGradient: 'from-green-700 to-emerald-700' },
                communication: { emoji: '💬', gradient: 'from-purple-600 to-violet-600', hoverGradient: 'from-purple-700 to-violet-700' },
                analytics: { emoji: '📊', gradient: 'from-orange-600 to-red-600', hoverGradient: 'from-orange-700 to-red-700' }
              };
              const config = categoryConfig[key as keyof typeof categoryConfig];
              
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="lg"
                  className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm ${
                    selectedCategory === key 
                      ? `bg-gradient-to-r ${config.gradient} hover:${config.hoverGradient} text-white border-0 shadow-xl` 
                      : 'bg-white/80 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <span className="mr-2 text-lg">{config.emoji}</span>
                  {label}
                  <Badge variant="secondary" className="ml-2 animate-pulse">{toolsByCategory[key]?.length || 0}</Badge>
                  {selectedCategory === key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        {selectedCategory === 'all' ? (
          // Show by category when viewing all
          <div className="space-y-8">
            {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => (
              <div key={categoryKey}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                  <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  {categoryLabel}
                  <Badge variant="outline" className="bg-white/80 border-purple-200 text-purple-700 shadow-sm animate-pulse">
                    {toolsByCategory[categoryKey]?.length || 0} tools
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {toolsByCategory[categoryKey]?.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show filtered tools
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolkitTool }) {
  const IconComponent = tool.icon;
  
  const categoryGradients = {
    staff: 'from-blue-500 to-cyan-500',
    content: 'from-green-500 to-emerald-500',
    communication: 'from-purple-500 to-violet-500',
    analytics: 'from-orange-500 to-red-500'
  };
  
  return (
    <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer border-2 hover:border-purple-300 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm overflow-hidden relative">
      {/* Animated background effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryGradients[tool.category]} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryGradients[tool.category]} shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:rotate-6`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors duration-300">
                {tool.title}
              </CardTitle>
              {tool.badge && (
                <Badge 
                  variant={tool.badgeVariant} 
                  className="mt-2 shadow-sm animate-pulse bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0"
                >
                  {tool.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative z-10">
        <CardDescription className="text-sm mb-4 leading-relaxed text-gray-600">
          {tool.description}
        </CardDescription>
        
        <Link href={tool.route}>
          <Button 
            className={`w-full shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-r ${categoryGradients[tool.category]} hover:opacity-90 border-0 font-semibold text-white transform hover:scale-105 relative overflow-hidden`}
            size="sm"
          >
            <span className="relative z-10">Launch Tool ✨</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}