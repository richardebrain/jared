import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Send, 
  Calendar, 
  Image, 
  Type, 
  Star, 
  Users, 
  Eye, 
  Archive, 
  Trash2, 
  ArrowLeft,
  FileText,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface Newsletter {
  id: number;
  title: string;
  subtitle: string;
  content: {
    sections: Array<{
      id: string;
      type: 'text' | 'image' | 'event' | 'announcement' | 'staff_spotlight';
      title?: string;
      content?: string;
      imageUrl?: string;
      date?: string;
      location?: string;
      metadata?: Record<string, any>;
    }>;
  };
  featuredImage: string;
  status: 'draft' | 'published' | 'archived';
  scheduledFor: string | null;
  publishedAt: string | null;
  recipientGroups: string[];
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterSection {
  id: string;
  type: 'text' | 'image' | 'event' | 'announcement' | 'staff_spotlight';
  title?: string;
  content?: string;
  imageUrl?: string;
  date?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export default function NewsletterManager() {
  const { toast } = useToast();
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<NewsletterSection | null>(null);
  const [newSection, setNewSection] = useState<Partial<NewsletterSection>>({
    type: 'text',
    title: '',
    content: ''
  });
  const [showContentSuggestions, setShowContentSuggestions] = useState(false);
  const [contentSuggestions, setContentSuggestions] = useState<Array<{
    type: string;
    title: string;
    content: string;
    category: string;
  }>>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  // Fetch newsletters for the school
  const { data: newsletters = [], isLoading } = useQuery({
    queryKey: ['/api/admin/newsletters'],
    queryFn: async () => {
      const response = await fetch('/api/admin/newsletters', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch newsletters');
      return response.json();
    }
  });

  // Create or update newsletter
  const saveNewsletter = useMutation({
    mutationFn: async (newsletterData: Partial<Newsletter>) => {
      const url = newsletterData.id ? `/api/admin/newsletters/${newsletterData.id}` : '/api/admin/newsletters';
      const method = newsletterData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newsletterData)
      });
      if (!response.ok) throw new Error('Failed to save newsletter');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Saved",
        description: "Your newsletter has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletters'] });
      setIsEditing(false);
      setSelectedNewsletter(null);
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "There was an error saving your newsletter.",
        variant: "destructive"
      });
    }
  });

  // Publish newsletter
  const publishNewsletter = useMutation({
    mutationFn: async ({ id, scheduledFor }: { id: number, scheduledFor?: string }) => {
      const response = await fetch(`/api/admin/newsletters/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scheduledFor })
      });
      if (!response.ok) throw new Error('Failed to publish newsletter');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Published",
        description: "Your newsletter has been published and will appear on the school dashboard."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/school-dashboard'] });
    }
  });

  // Generate PDF
  const generatePDF = async (newsletter: Newsletter) => {
    try {
      const response = await fetch(`/api/admin/newsletters/${newsletter.id}/pdf`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-${newsletter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Newsletter PDF has been downloaded successfully."
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive"
      });
    }
  };

  // Generate smart content suggestions using AI
  const generateContentSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/admin/newsletter-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentMonth: new Date().getMonth() + 1,
          currentSeason: getCurrentSeason(),
          schoolType: 'preschool'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate suggestions');
      
      const suggestions = await response.json();
      setContentSuggestions(suggestions);
      setShowContentSuggestions(true);
      
      toast({
        title: "Content Suggestions Generated",
        description: "AI has created personalized content suggestions for your newsletter."
      });
    } catch (error) {
      toast({
        title: "Suggestion Generation Failed",
        description: "Unable to generate content suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  // Helper function to determine current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  };

  // Add suggested content to newsletter
  const addSuggestedContent = (suggestion: any) => {
    const section: NewsletterSection = {
      id: Date.now().toString(),
      type: suggestion.type as any,
      title: suggestion.title,
      content: suggestion.content,
      metadata: { category: suggestion.category }
    };

    if (selectedNewsletter) {
      const updatedNewsletter = {
        ...selectedNewsletter,
        content: {
          ...selectedNewsletter.content,
          sections: [...selectedNewsletter.content.sections, section]
        }
      };
      setSelectedNewsletter(updatedNewsletter);
      
      toast({
        title: "Content Added",
        description: `"${suggestion.title}" has been added to your newsletter.`
      });
    }
  };

  const createNewNewsletter = () => {
    const newNewsletter: Newsletter = {
      id: 0,
      title: 'New Newsletter',
      subtitle: '',
      content: { sections: [] },
      featuredImage: '',
      status: 'draft',
      scheduledFor: null,
      publishedAt: null,
      recipientGroups: ['teachers'],
      readCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedNewsletter(newNewsletter);
    setIsEditing(true);
  };

  const addSection = () => {
    if (!selectedNewsletter || !newSection.type) return;
    
    const section: NewsletterSection = {
      id: `section-${Date.now()}`,
      type: newSection.type,
      title: newSection.title || '',
      content: newSection.content || '',
      imageUrl: newSection.imageUrl || '',
      date: newSection.date || '',
      location: newSection.location || ''
    };

    const updatedNewsletter = {
      ...selectedNewsletter,
      content: {
        sections: [...selectedNewsletter.content.sections, section]
      }
    };
    
    setSelectedNewsletter(updatedNewsletter);
    setNewSection({ type: 'text', title: '', content: '' });
  };

  const removeSection = (sectionId: string) => {
    if (!selectedNewsletter) return;
    
    const updatedNewsletter = {
      ...selectedNewsletter,
      content: {
        sections: selectedNewsletter.content.sections.filter(s => s.id !== sectionId)
      }
    };
    
    setSelectedNewsletter(updatedNewsletter);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'announcement': return <FileText className="h-4 w-4" />;
      case 'staff_spotlight': return <Star className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading newsletters...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedNewsletter && isEditing) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsEditing(false);
                setSelectedNewsletter(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Newsletters
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Newsletter Editor</h1>
              <p className="text-gray-600">Create and customize your school newsletter</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => saveNewsletter.mutate(selectedNewsletter)}
              disabled={saveNewsletter.isPending}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => publishNewsletter.mutate({ id: selectedNewsletter.id })}
              disabled={publishNewsletter.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Newsletter Content Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={selectedNewsletter.title}
                    onChange={(e) => setSelectedNewsletter({
                      ...selectedNewsletter,
                      title: e.target.value
                    })}
                    placeholder="Newsletter title..."
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={selectedNewsletter.subtitle}
                    onChange={(e) => setSelectedNewsletter({
                      ...selectedNewsletter,
                      subtitle: e.target.value
                    })}
                    placeholder="Optional subtitle..."
                  />
                </div>
                <div>
                  <Label htmlFor="featured-image">Featured Image URL</Label>
                  <Input
                    id="featured-image"
                    value={selectedNewsletter.featuredImage}
                    onChange={(e) => setSelectedNewsletter({
                      ...selectedNewsletter,
                      featuredImage: e.target.value
                    })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Content Sections</CardTitle>
                <CardDescription>
                  Add different types of content to your newsletter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Existing Sections */}
                <div className="space-y-4 mb-6">
                  {selectedNewsletter.content.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getSectionIcon(section.type)}
                          <span className="font-medium capitalize">{section.type.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {section.title && (
                          <h4 className="font-semibold">{section.title}</h4>
                        )}
                        {section.content && (
                          <p className="text-sm text-gray-600 line-clamp-2">{section.content}</p>
                        )}
                        {section.date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {section.date}
                          </div>
                        )}
                        {section.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {section.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Section */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Add New Section</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Section Type</Label>
                      <Select 
                        value={newSection.type} 
                        onValueChange={(value) => setNewSection({...newSection, type: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Content</SelectItem>
                          <SelectItem value="image">Image Gallery</SelectItem>
                          <SelectItem value="event">Event Announcement</SelectItem>
                          <SelectItem value="announcement">General Announcement</SelectItem>
                          <SelectItem value="staff_spotlight">Staff Spotlight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newSection.title}
                        onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                        placeholder="Section title..."
                      />
                    </div>
                    
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={newSection.content}
                        onChange={(e) => setNewSection({...newSection, content: e.target.value})}
                        placeholder="Write your content here..."
                        rows={4}
                      />
                    </div>
                    
                    {newSection.type === 'image' && (
                      <div>
                        <Label>Image URL</Label>
                        <Input
                          value={newSection.imageUrl}
                          onChange={(e) => setNewSection({...newSection, imageUrl: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    )}
                    
                    {newSection.type === 'event' && (
                      <>
                        <div>
                          <Label>Event Date</Label>
                          <Input
                            type="date"
                            value={newSection.date}
                            onChange={(e) => setNewSection({...newSection, date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={newSection.location}
                            onChange={(e) => setNewSection({...newSection, location: e.target.value})}
                            placeholder="Event location..."
                          />
                        </div>
                      </>
                    )}
                    
                    <Button onClick={addSection} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Recipients</Label>
                    <div className="space-y-2 mt-2">
                      {['teachers', 'parents', 'staff', 'all'].map(group => (
                        <label key={group} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedNewsletter.recipientGroups.includes(group)}
                            onChange={(e) => {
                              const groups = e.target.checked
                                ? [...selectedNewsletter.recipientGroups, group]
                                : selectedNewsletter.recipientGroups.filter(g => g !== group);
                              setSelectedNewsletter({
                                ...selectedNewsletter,
                                recipientGroups: groups
                              });
                            }}
                          />
                          <span className="capitalize">{group}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Schedule For</Label>
                    <Input
                      type="datetime-local"
                      value={selectedNewsletter.scheduledFor || ''}
                      onChange={(e) => setSelectedNewsletter({
                        ...selectedNewsletter,
                        scheduledFor: e.target.value
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const template = {
                        sections: [
                          {
                            id: 'welcome-' + Date.now(),
                            type: 'text' as const,
                            title: 'Welcome Message',
                            content: 'Dear families and staff, welcome to this month\'s newsletter...'
                          },
                          {
                            id: 'events-' + Date.now(),
                            type: 'event' as const,
                            title: 'Upcoming Events',
                            content: 'Join us for these exciting upcoming events!',
                            date: new Date().toISOString().split('T')[0]
                          }
                        ]
                      };
                      setSelectedNewsletter({
                        ...selectedNewsletter,
                        content: template
                      });
                    }}
                  >
                    Monthly Update
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const template = {
                        sections: [
                          {
                            id: 'announcement-' + Date.now(),
                            type: 'announcement' as const,
                            title: 'Important Announcement',
                            content: 'We have an important update to share with you...'
                          }
                        ]
                      };
                      setSelectedNewsletter({
                        ...selectedNewsletter,
                        content: template
                      });
                    }}
                  >
                    Quick Announcement
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const template = {
                        sections: [
                          {
                            id: 'spotlight-' + Date.now(),
                            type: 'staff_spotlight' as const,
                            title: 'Staff Spotlight',
                            content: 'This month we\'re highlighting one of our amazing team members...'
                          }
                        ]
                      };
                      setSelectedNewsletter({
                        ...selectedNewsletter,
                        content: template
                      });
                    }}
                  >
                    Staff Spotlight
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/director-toolkit">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Toolkit
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Manager</h1>
            <p className="text-gray-600">Create and manage school newsletters with rich content</p>
          </div>
        </div>
        <Button onClick={createNewNewsletter}>
          <Plus className="h-4 w-4 mr-2" />
          Create Newsletter
        </Button>
      </div>

      {/* Newsletter List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsletters.map((newsletter: Newsletter) => (
          <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{newsletter.title}</CardTitle>
                  {newsletter.subtitle && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {newsletter.subtitle}
                    </CardDescription>
                  )}
                </div>
                {getStatusBadge(newsletter.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {newsletter.featuredImage && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={newsletter.featuredImage} 
                    alt={newsletter.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {newsletter.readCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {newsletter.recipientGroups.length}
                  </div>
                </div>
                <span>{new Date(newsletter.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedNewsletter(newsletter);
                    setIsEditing(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {newsletter.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => publishNewsletter.mutate({ id: newsletter.id })}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {newsletters.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters yet</h3>
            <p className="text-gray-600 mb-4">Create your first newsletter to get started</p>
            <Button onClick={createNewNewsletter}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Newsletter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}