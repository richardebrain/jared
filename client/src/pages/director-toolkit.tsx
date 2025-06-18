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
  Zap,
  Mic
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
    id: 'video-library-admin',
    title: 'Video Library Manager',
    description: 'Manage video resources, add custom content, and organize collections',
    icon: FileText,
    route: '/admin/video-library',
    category: 'content'
  },
  {
    id: 'podcast-generator',
    title: 'Podcast Generator',
    description: 'Create educational podcasts with AI-generated scripts and professional narration',
    icon: Mic,
    route: '/podcast-generator',
    badge: 'AI-Powered',
    badgeVariant: 'outline',
    category: 'content'
  },
  {
    id: 'music-maker-prek',
    title: 'MusicMakerPrek',
    description: 'Generate custom songs for your classroom with AI - one song per week limit',
    icon: Sparkles,
    route: '/music-maker',
    badge: 'New',
    badgeVariant: 'destructive',
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
    route: '/admin-meeting-creator',
    badge: 'New',
    badgeVariant: 'destructive',
    category: 'communication'
  },
  {
    id: 'newsletter-manager',
    title: 'Newsletter Manager',
    description: 'Create rich newsletters with photos, events, and announcements for your school',
    icon: Mail,
    route: '/newsletter-manager',
    badge: 'Enhanced',
    badgeVariant: 'secondary',
    category: 'communication'
  },
  
  // Analytics & Management
  {
    id: 'certificate-manager',
    title: 'Certificate Manager',
    description: 'Track teacher certifications, get 30-day expiration warnings, and send reminders',
    icon: Award,
    route: '/certificate-manager',
    badge: 'Essential',
    badgeVariant: 'destructive',
    category: 'staff'
  },
  {
    id: 'perfect-manager',
    title: 'Perfect Manager',
    description: 'AI-powered management advisor providing strategies, resources, and solutions for staff challenges',
    icon: Zap,
    route: '/admin/perfect-manager',
    badge: 'New',
    badgeVariant: 'destructive',
    category: 'staff'
  },
  {
    id: 'school-settings',
    title: 'School Settings',
    description: 'Configure school information, contact details, branding, and core values',
    icon: Settings,
    route: '/school-settings',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl font-bold mb-4">Director Toolkit</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Your administrative dashboard for managing staff, content, and professional development
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-7xl mx-auto">

        {/* Category Filter */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Filter Tools by Category
            </h2>
            <p className="text-blue-100">
              Select a category to find the tools you need
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="default"
              className={selectedCategory === 'all' ? 'bg-white text-blue-800 hover:bg-gray-100 font-semibold shadow-lg' : 'border-2 border-white bg-blue-800/20 text-white hover:bg-white hover:text-blue-800 font-semibold transition-all duration-300'}
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
                className={selectedCategory === key ? 'bg-white text-blue-800 hover:bg-gray-100 font-semibold shadow-lg' : 'border-2 border-white bg-blue-800/20 text-white hover:bg-white hover:text-blue-800 font-semibold transition-all duration-300'}
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
                <h2 className="text-xl font-semibold mb-4 text-white border-b border-white/30 pb-2 flex items-center gap-2">
                  <div className={`w-1 h-6 rounded-full ${
                    categoryKey === 'staff' ? 'bg-blue-500' :
                    categoryKey === 'content' ? 'bg-green-500' :
                    categoryKey === 'communication' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
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
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolkitTool }) {
  const IconComponent = tool.icon;
  
  const categoryStyles = {
    staff: {
      iconGradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      buttonGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
    },
    content: {
      iconGradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      buttonGradient: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
    },
    communication: {
      iconGradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
      buttonGradient: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
    },
    analytics: {
      iconGradient: 'bg-gradient-to-br from-orange-500 to-red-600',
      buttonGradient: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
    }
  };
  
  const style = categoryStyles[tool.category];
  
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group">
      <CardHeader className="text-center pb-6">
        <div className={`w-20 h-20 ${style.iconGradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{tool.title}</CardTitle>
        {tool.badge && (
          <Badge 
            variant={tool.badgeVariant} 
            className="mb-2"
          >
            {tool.badge}
          </Badge>
        )}
        <CardDescription className="text-gray-600 leading-relaxed">
          {tool.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href={tool.route}>
          <Button className={`${style.buttonGradient} text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}>
            Launch Tool
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}