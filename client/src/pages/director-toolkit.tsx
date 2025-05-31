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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Simple Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Director Toolkit
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your administrative dashboard for managing staff, content, and professional development
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Filter Tools by Category
            </h2>
            <p className="text-gray-600">
              Select a category to find the tools you need
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="default"
              onClick={() => setSelectedCategory('all')}
            >
              All Tools
              <Badge variant="secondary" className="ml-2">{directorTools.length}</Badge>
            </Button>
            
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="default"
                onClick={() => setSelectedCategory(key)}
              >
                {label}
                <Badge variant="secondary" className="ml-2">{toolsByCategory[key]?.length || 0}</Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {selectedCategory === 'all' ? (
          // Show by category when viewing all
          <div className="space-y-8">
            {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => (
              <div key={categoryKey}>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">
                  {categoryLabel}
                  <Badge variant="outline" className="ml-2">
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