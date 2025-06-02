import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Palette, 
  Save,
  Settings,
  Users,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface School {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  website: string | null;
  founded: string | null;
  type: string | null;
  capacity: number | null;
  customization: {
    primaryColor?: string;
    secondaryColor?: string;
    coreValues?: string[];
  } | null;
}

export default function SchoolSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: school, isLoading } = useQuery({
    queryKey: ['/api/school/settings'],
  });

  const [formData, setFormData] = useState<Partial<School>>({});

  const updateSchoolMutation = useMutation({
    mutationFn: (data: Partial<School>) => 
      apiRequest('/api/school/settings', { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school/settings'] });
      toast({
        title: "School Settings Updated",
        description: "Your school information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update school settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof School, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/director-toolkit">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Director Toolkit
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/director-toolkit">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Director Toolkit
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">School Settings</h1>
          <p className="text-muted-foreground">
            Manage your school's information and preferences
          </p>
        </div>
      </div>

      {/* School Info Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">School Name</p>
                <p className="text-xl font-bold">{school?.name || 'Raising Arizona Preschool'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                <p className="text-xl font-bold">{school?.capacity || 120} students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Founded</p>
                <p className="text-xl font-bold">{school?.founded || '2015'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-xl font-bold">{school?.type || 'Private'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="branding">Branding & Values</TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      placeholder={school?.name || 'Enter school name'}
                      value={formData.name || school?.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">School Type</Label>
                    <Input
                      id="type"
                      placeholder={school?.type || 'Private, Public, Charter, etc.'}
                      value={formData.type || school?.type || ''}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Student Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="120"
                      value={formData.capacity || school?.capacity || ''}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="founded">Year Founded</Label>
                    <Input
                      id="founded"
                      placeholder="2015"
                      value={formData.founded || school?.founded || ''}
                      onChange={(e) => handleInputChange('founded', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">School Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your school's mission and approach..."
                    value={formData.description || school?.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.yourschool.com"
                    value={formData.website || school?.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updateSchoolMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Details Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="info@yourschool.com"
                      value={formData.contactEmail || school?.contactEmail || ''}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.contactPhone || school?.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Education Street"
                    value={formData.address || school?.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Phoenix"
                      value={formData.city || school?.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="AZ"
                      value={formData.state || school?.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="85001"
                      value={formData.zipCode || school?.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateSchoolMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding & Values Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                School Branding & Core Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.customization?.primaryColor || school?.customization?.primaryColor || '#3b82f6'}
                        onChange={(e) => handleInputChange('customization', {
                          ...formData.customization,
                          primaryColor: e.target.value
                        })}
                        className="w-16"
                      />
                      <Input
                        placeholder="#3b82f6"
                        value={formData.customization?.primaryColor || school?.customization?.primaryColor || ''}
                        onChange={(e) => handleInputChange('customization', {
                          ...formData.customization,
                          primaryColor: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.customization?.secondaryColor || school?.customization?.secondaryColor || '#10b981'}
                        onChange={(e) => handleInputChange('customization', {
                          ...formData.customization,
                          secondaryColor: e.target.value
                        })}
                        className="w-16"
                      />
                      <Input
                        placeholder="#10b981"
                        value={formData.customization?.secondaryColor || school?.customization?.secondaryColor || ''}
                        onChange={(e) => handleInputChange('customization', {
                          ...formData.customization,
                          secondaryColor: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Core Values</Label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(school?.customization?.coreValues || [
                      'Respect', 'Kindness', 'Learning', 'Growth', 'Community'
                    ]).map((value, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {value}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Enter core values separated by commas (e.g., Respect, Kindness, Learning, Growth)"
                    value={formData.customization?.coreValues?.join(', ') || ''}
                    onChange={(e) => handleInputChange('customization', {
                      ...formData.customization,
                      coreValues: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                    })}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updateSchoolMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSchoolMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}