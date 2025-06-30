import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import raisingArizonaLogo from "@assets/raising-arizona-logo.jpg";
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
  Calendar,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Clock,
  Mail as MailIcon,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TeamManagementTab from '@/components/TeamManagementTab';

interface School {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
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
  const { user, isOwner, isSchoolAdmin, isAdmin } = useAuth();
  const [emails, setEmails] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { data: school, isLoading } = useQuery({
    queryKey: ['/api/school/settings'],
  });

  const [formData, setFormData] = useState<Partial<School>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingCoreValue, setEditingCoreValue] = useState<number | null>(null);
  const [newCoreValue, setNewCoreValue] = useState('');

  // Initialize form data when school data loads, but don't override if user has unsaved changes
  useEffect(() => {
    if (school && !hasUnsavedChanges) {
      setFormData(school);
    }
  }, [school, hasUnsavedChanges]);

  // Get the user's school ID
  const schoolId = user?.schoolId;

  // Query to get all invitations for this school
  const { data: invitations = [], isLoading: isLoadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: [`/api/teacher-invitations/school/${schoolId}`],
    enabled: !!schoolId && (isOwner || isSchoolAdmin || isAdmin),
  });

  const updateSchoolMutation = useMutation({
    mutationFn: (data: Partial<School>) => 
      apiRequest('/api/school/settings', { method: 'PATCH', data }),
    onSuccess: async (response, updatedData) => {
      
      // Update local formData to reflect the saved changes FIRST
      setFormData(prev => ({ ...prev, ...updatedData }));
      
      // Invalidate all related queries to ensure all pages get fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/school/settings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/school/info'] });
      
      if (user?.schoolId) {
        await queryClient.invalidateQueries({ queryKey: ['/api/school/info', user.schoolId] });
        await queryClient.invalidateQueries({ queryKey: [`/api/school/info/${user.schoolId}`] });
      }
      
      // Force refresh of any other queries that depend on school settings
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === '/api/school/settings' || 
                 query.queryKey[0] === '/api/school/info' ||
                 (typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('school'));
        }
      });
      
      // Clear unsaved changes flag AFTER all cache invalidation is complete
      setHasUnsavedChanges(false);
      
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

  // Mutation to upload emails and send invitations
  const uploadMutation = useMutation({
    mutationFn: async (emailsToInvite: string[]) => {
      const response = await apiRequest(
        "POST", 
        "/api/teacher-invitations/upload", 
        { emails: emailsToInvite, schoolId: schoolId }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations Sent",
        description: `Successfully processed ${data.invitations.filter(i => i.success).length} out of ${data.invitations.length} invitations.`,
        variant: "default",
      });
      setEmails("");
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error sending invitations:", error);
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Mutation to resend an invitation
  const resendMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/teacher-invitations/resend/${invitationId}`, 
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Resent",
        description: data.message,
        variant: "default",
      });
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation to cancel an invitation
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/teacher-invitations/${invitationId}`, 
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Cancelled",
        description: data.message,
        variant: "default",
      });
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission - formData being sent:', formData);
    console.log('Logo URL specifically:', formData.logoUrl);
    updateSchoolMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof School, value: any) => {
    console.log(`Handling input change - field: ${field}, value:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Updated formData:', newData);
      return newData;
    });
    setHasUnsavedChanges(true);
    console.log('Set hasUnsavedChanges to true');
  };

  // Core value management functions
  const handleAddCoreValue = () => {
    if (newCoreValue.trim()) {
      const currentValues = formData.customization?.coreValues || [
        'Be Consistent', 'Be Prepared', 'Be Committed', 'Be Positive', 'Be Caring'
      ];
      handleInputChange('customization', {
        ...formData.customization,
        coreValues: [...currentValues, newCoreValue.trim()]
      });
      setNewCoreValue('');
    }
  };

  const handleDeleteCoreValue = (index: number) => {
    const currentValues = formData.customization?.coreValues || [
      'Be Consistent', 'Be Prepared', 'Be Committed', 'Be Positive', 'Be Caring'
    ];
    const newValues = currentValues.filter((_, i) => i !== index);
    handleInputChange('customization', {
      ...formData.customization,
      coreValues: newValues
    });
  };

  const handleEditCoreValue = (index: number, newValue: string) => {
    const currentValues = formData.customization?.coreValues || [
      'Be Consistent', 'Be Prepared', 'Be Committed', 'Be Positive', 'Be Caring'
    ];
    const newValues = [...currentValues];
    newValues[index] = newValue.trim();
    handleInputChange('customization', {
      ...formData.customization,
      coreValues: newValues
    });
    setEditingCoreValue(null);
  };

  // Handle invitation form submission
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Split emails into an array, clean up whitespace and empty lines
    const emailList = emails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emailList.length === 0) {
      toast({
        title: "No Emails Provided",
        description: "Please enter at least one email address.",
        variant: "destructive",
      });
      return;
    }

    // Show processing state
    setIsProcessing(true);

    // Send invitations
    uploadMutation.mutate(emailList);
  };

  // Render invitation status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><MailIcon className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if invitation is expired
  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Check if user has permission to invite teachers
  const hasInvitePermission = isOwner || isSchoolAdmin || isAdmin;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
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
        <TabsList className={`grid w-full ${hasInvitePermission ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="branding">Branding & Values</TabsTrigger>
          {hasInvitePermission && (
            <TabsTrigger value="team">Team Management</TabsTrigger>
          )}
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
                {/* School Logo Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">School Logo</Label>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Current Logo Display */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <img 
                          src={formData.logoUrl || school?.logoUrl || raisingArizonaLogo} 
                          alt="School Logo" 
                          className="w-full h-full object-contain rounded-lg"
                          onLoad={() => console.log('Logo loaded:', formData.logoUrl || school?.logoUrl || raisingArizonaLogo)}
                          onError={(e) => {
                            // Fallback to building icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="text-center hidden">
                          <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No logo available</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Current Logo (as shown in header)<br/>
                        <span className="text-xs">Recommended: 200x200px</span>
                      </p>
                    </div>

                    {/* Logo Upload Controls */}
                    <div className="flex-1 space-y-4">
                      {/* File Upload Section */}
                      <div className="space-y-2">
                        <Label htmlFor="logoFile">Upload Logo File</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="logoFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Convert file to base64 or handle upload
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  handleInputChange('logoUrl', result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('logoFile')?.click()}
                          >
                            Browse
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Upload an image file (PNG, JPG, GIF). Recommended size: 200x200px
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      {/* URL Input Section */}
                      <div className="space-y-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input
                          id="logoUrl"
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={formData.logoUrl || school?.logoUrl || ''}
                          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Or enter a direct URL to your school logo image
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleInputChange('logoUrl', '')}
                        >
                          Clear Logo
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const url = prompt('Enter logo URL:');
                            if (url) handleInputChange('logoUrl', url);
                          }}
                        >
                          Add Logo URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6" />

                {/* Color Customization */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Brand Colors</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Customize your school's brand colors that will be used throughout the platform interface, 
                      including headers, buttons, and accent elements.
                    </p>
                  </div>
                  
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
                </div>

                <div className="space-y-4">
                  <Label>Core Values</Label>
                  <p className="text-sm text-gray-600">
                    These values will be used throughout the platform for teacher recognition and training modules.
                  </p>
                  
                  {/* Current Core Values List */}
                  <div className="space-y-2">
                    {(formData.customization?.coreValues || school?.customization?.coreValues || [
                      'Be Consistent', 'Be Prepared', 'Be Committed', 'Be Positive', 'Be Caring'
                    ]).map((value, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                        {editingCoreValue === index ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={value}
                              onChange={(e) => {
                                const currentValues = formData.customization?.coreValues || school?.customization?.coreValues || [
                                  'Be Consistent', 'Be Prepared', 'Be Committed', 'Be Positive', 'Be Caring'
                                ];
                                const tempValues = [...currentValues];
                                tempValues[index] = e.target.value;
                                handleInputChange('customization', {
                                  ...formData.customization,
                                  coreValues: tempValues
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditCoreValue(index, e.currentTarget.value);
                                } else if (e.key === 'Escape') {
                                  setEditingCoreValue(null);
                                }
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleEditCoreValue(index, value)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingCoreValue(null)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline" className="text-sm flex-1 justify-start">
                              {value}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCoreValue(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCoreValue(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add New Core Value */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new core value (e.g., Be Respectful)"
                      value={newCoreValue}
                      onChange={(e) => setNewCoreValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCoreValue();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddCoreValue}
                      disabled={!newCoreValue.trim()}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
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

        {/* Team Management Tab */}
        {hasInvitePermission && schoolId && (
          <TabsContent value="team" className="space-y-6">
            <TeamManagementTab schoolId={schoolId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}