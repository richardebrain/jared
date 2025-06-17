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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
          
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Director Toolkit
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto bg-white/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-sm">
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
              className={selectedCategory === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'}
            >
              All Tools
              <Badge variant="secondary" className="ml-2">{directorTools.length}</Badge>
            </Button>
            
            {Object.entries(categoryLabels).map(([key, label]) => {
              const categoryColors = {
                staff: selectedCategory === key ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white hover:bg-blue-50 border-blue-200',
                content: selectedCategory === key ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white hover:bg-green-50 border-green-200',
                communication: selectedCategory === key ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white hover:bg-purple-50 border-purple-200',
                analytics: selectedCategory === key ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-white hover:bg-orange-50 border-orange-200'
              };
              
              return (
                <Button
                  key={key}
                  variant="outline"
                  size="default"
                  onClick={() => setSelectedCategory(key)}
                  className={categoryColors[key as keyof typeof categoryColors]}
                >
                  {label}
                  <Badge variant="secondary" className="ml-2">{toolsByCategory[key]?.length || 0}</Badge>
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
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
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
  );
}

function ToolCard({ tool }: { tool: ToolkitTool }) {
  const IconComponent = tool.icon;
  
  const categoryStyles = {
    staff: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    content: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    communication: {
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    analytics: {
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonColor: 'bg-orange-600 hover:bg-orange-700'
    }
  };
  
  const style = categoryStyles[tool.category];
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${style.iconBg}`}>
              <IconComponent className={`h-5 w-5 ${style.iconColor}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-gray-900">
                {tool.title}
              </CardTitle>
              {tool.badge && (
                <Badge 
                  variant={tool.badgeVariant} 
                  className="mt-1"
                >
                  {tool.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-4 text-gray-600">
          {tool.description}
        </CardDescription>
        
        <Link href={tool.route}>
          <Button 
            className={`w-full text-white ${style.buttonColor}`}
            size="sm"
          >
            Launch Tool
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}