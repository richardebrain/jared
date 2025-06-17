import React from 'react';
import SettingsLayout from '@/components/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Video, 
  Users, 
  FileText, 
  Upload, 
  Download,
  Settings,
  Trash2,
  Eye,
  Edit
} from 'lucide-react';

export default function ContentPage() {
  const { toast } = useToast();

  const handleFeatureClick = (feature: string) => {
    toast({
      title: "Feature Available",
      description: `${feature} management is available in the admin dashboard. Navigate to Director Toolkit for full content management capabilities.`
    });
  };

  return (
    <SettingsLayout
      title="Content Management"
      description="Manage your platform's educational content, modules, and resources"
    >
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">
                    +3 from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Video Resources</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">128</div>
                  <p className="text-xs text-muted-foreground">
                    Available in library
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    Teachers enrolled
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your educational content and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleFeatureClick("Module")}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Create New Module</div>
                      <div className="text-sm text-muted-foreground">Build educational content</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleFeatureClick("Video")}
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Manage Videos</div>
                      <div className="text-sm text-muted-foreground">Organize video library</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleFeatureClick("User")}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">User Management</div>
                      <div className="text-sm text-muted-foreground">Manage teacher accounts</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleFeatureClick("Content")}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Content Library</div>
                      <div className="text-sm text-muted-foreground">Browse all resources</div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Management</CardTitle>
                <CardDescription>
                  Create, edit, and organize your educational modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Recent Modules</h4>
                    <Button size="sm" onClick={() => handleFeatureClick("Module creation")}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Module
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { title: "Classroom Management Basics", status: "Published", type: "Core" },
                      { title: "Positive Behavior Support", status: "Draft", type: "Specialty" },
                      { title: "Parent Communication", status: "Published", type: "Core" },
                    ].map((module, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{module.title}</div>
                            <div className="text-sm text-muted-foreground">{module.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={module.status === "Published" ? "default" : "secondary"}>
                            {module.status}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Library</CardTitle>
                <CardDescription>
                  Manage your video resources and educational content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Video Categories</h4>
                    <Button size="sm" onClick={() => handleFeatureClick("Video library")}>
                      <Video className="h-4 w-4 mr-2" />
                      Manage Videos
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { category: "Classroom Management", count: 24, recent: "2 hours ago" },
                      { category: "Child Development", count: 31, recent: "1 day ago" },
                      { category: "Safety & Health", count: 18, recent: "3 days ago" },
                      { category: "Parent Engagement", count: 22, recent: "1 week ago" },
                    ].map((category, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{category.category}</div>
                            <div className="text-sm text-muted-foreground">{category.count} videos</div>
                          </div>
                          <Badge variant="outline">{category.recent}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
                <CardDescription>
                  Configure content management preferences and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Access Control</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Allow teachers to create modules</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require admin approval for new content</span>
                      <Badge variant="secondary">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Community sharing enabled</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Content Policies</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automatic content moderation</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ECE compliance checking</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => handleFeatureClick("Advanced settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}