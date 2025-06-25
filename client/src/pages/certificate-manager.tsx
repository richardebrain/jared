import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, User, FileText, Shield, Heart, Utensils, CheckCircle, Clock, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  fingerprintExpiration: string | null;
  cprExpiration: string | null;
  firstAidExpiration: string | null;
  foodHandlerExpiration: string | null;
}

interface CertificationUpdate {
  teacherId: number;
  fingerprintExpiration?: string;
  cprExpiration?: string;
  firstAidExpiration?: string;
  foodHandlerExpiration?: string;
}

export default function CertificateManager() {
  const { toast } = useToast();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingCertifications, setEditingCertifications] = useState<CertificationUpdate>({
    teacherId: 0
  });

  // Fetch teachers in the same school as the director
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/school-teachers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/school-teachers', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return response.json();
    }
  });

  // Update teacher certifications
  const updateCertifications = useMutation({
    mutationFn: async (data: CertificationUpdate) => {
      const response = await fetch('/api/admin/update-teacher-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update certifications');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certifications Updated",
        description: "Teacher certifications have been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/school-teachers'] });
      setSelectedTeacher(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating the certifications.",
        variant: "destructive"
      });
    }
  });

  // Send certification reminder
  const sendReminder = useMutation({
    mutationFn: async ({ teacherId, certificationType, teacherName }: { 
      teacherId: number, 
      certificationType: string,
      teacherName: string 
    }) => {
      const response = await fetch('/api/admin/send-certification-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacherId, certificationType, teacherName })
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Reminder Sent",
        description: `${variables.certificationType} reminder sent to ${variables.teacherName}.`
      });
    }
  });

  // Calculate days until expiration
  const getDaysUntilExpiration = (expirationDate: string | null): number | null => {
    if (!expirationDate) return null;
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status badge for certification
  const getStatusBadge = (expirationDate: string | null) => {
    const daysUntil = getDaysUntilExpiration(expirationDate);
    
    if (!expirationDate) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Not Set
      </Badge>;
    }
    
    if (daysUntil === null) return null;
    
    if (daysUntil < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Expired {Math.abs(daysUntil)} days ago
      </Badge>;
    } else if (daysUntil <= 30) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {daysUntil} days left
      </Badge>;
    } else if (daysUntil <= 60) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {daysUntil} days left
      </Badge>;
    } else {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        {daysUntil} days left
      </Badge>;
    }
  };

  // Filter teachers by certification status
  const getTeachersByStatus = (status: 'expired' | 'expiring' | 'current' | 'missing') => {
    return teachers.filter(teacher => {
      const certifications = [
        teacher.fingerprintExpiration,
        teacher.cprExpiration,
        teacher.firstAidExpiration,
        teacher.foodHandlerExpiration
      ];

      const hasExpired = certifications.some(cert => {
        const days = getDaysUntilExpiration(cert);
        return days !== null && days < 0;
      });

      const isExpiring = certifications.some(cert => {
        const days = getDaysUntilExpiration(cert);
        return days !== null && days >= 0 && days <= 30;
      });

      const hasMissing = certifications.some(cert => !cert);

      const allCurrent = certifications.every(cert => {
        if (!cert) return false;
        const days = getDaysUntilExpiration(cert);
        return days !== null && days > 30;
      });

      switch (status) {
        case 'expired': return hasExpired;
        case 'expiring': return isExpiring && !hasExpired;
        case 'missing': return hasMissing && !hasExpired && !isExpiring;
        case 'current': return allCurrent && !hasMissing;
        default: return false;
      }
    });
  };

  const expiredTeachers = getTeachersByStatus('expired');
  const expiringTeachers = getTeachersByStatus('expiring');
  const missingTeachers = getTeachersByStatus('missing');
  const currentTeachers = getTeachersByStatus('current');

  // Get all expiring certificates with detailed information
  const getAllExpiringCertificates = () => {
    const expiringCerts: Array<{
      teacherId: number;
      teacherName: string;
      certificationType: string;
      certificationLabel: string;
      daysUntilExpiration: number;
      isExpired: boolean;
      expirationDate: string;
    }> = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    teachers.forEach((teacher: Teacher) => {
      const certifications = [
        { type: 'Fingerprint', date: teacher.fingerprintExpiration, label: 'Fingerprint Clearance' },
        { type: 'CPR', date: teacher.cprExpiration, label: 'CPR Certification' },
        { type: 'First Aid', date: teacher.firstAidExpiration, label: 'First Aid Certification' },
        { type: 'Food Handler', date: teacher.foodHandlerExpiration, label: 'Food Handler Permit' }
      ];

      certifications.forEach(cert => {
        if (cert.date) {
          const expirationDate = new Date(cert.date);
          if (expirationDate <= thirtyDaysFromNow) {
            const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
            expiringCerts.push({
              teacherId: teacher.id,
              teacherName: `${teacher.firstName} ${teacher.lastName}`,
              certificationType: cert.type,
              certificationLabel: cert.label,
              daysUntilExpiration,
              isExpired: daysUntilExpiration <= 0,
              expirationDate: cert.date
            });
          }
        }
      });
    });

    return expiringCerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  };

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditingCertifications({
      teacherId: teacher.id,
      fingerprintExpiration: teacher.fingerprintExpiration || '',
      cprExpiration: teacher.cprExpiration || '',
      firstAidExpiration: teacher.firstAidExpiration || '',
      foodHandlerExpiration: teacher.foodHandlerExpiration || ''
    });
  };

  const handleSaveChanges = () => {
    updateCertifications.mutate(editingCertifications);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teacher certifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CPR and Fingerprint Tracking</h1>
        <p className="text-gray-600">
          Monitor and manage teacher certification expiration dates for CPR, First Aid, Fingerprint, and Food Handler certifications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Expired</p>
                <p className="text-2xl font-bold text-red-900">{expiredTeachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-900">{expiringTeachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">Missing Info</p>
                <p className="text-2xl font-bold text-gray-900">{missingTeachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Current</p>
                <p className="text-2xl font-bold text-green-900">{currentTeachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certification Status Tabs */}
      <Tabs defaultValue="expired" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expired" className="data-[state=active]:bg-red-100">
            Expired ({expiredTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-yellow-100">
            Expiring Soon ({expiringTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="missing" className="data-[state=active]:bg-gray-100">
            Missing Info ({missingTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="current" className="data-[state=active]:bg-green-100">
            Current ({currentTeachers.length})
          </TabsTrigger>
        </TabsList>

        {[
          { key: 'expired', teachers: expiredTeachers, title: 'Expired Certifications' },
          { key: 'expiring', teachers: expiringTeachers, title: 'Expiring Soon (30 days)' },
          { key: 'missing', teachers: missingTeachers, title: 'Missing Information' },
          { key: 'current', teachers: currentTeachers, title: 'Current Certifications' }
        ].map(({ key, teachers: teacherList, title }) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  {teacherList.length === 0 
                    ? "No teachers in this category" 
                    : `${teacherList.length} teacher${teacherList.length === 1 ? '' : 's'} requiring attention`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teacherList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No teachers in this category</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacherList.map((teacher) => (
                      <div key={teacher.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <h3 className="font-semibold">
                                {teacher.firstName} {teacher.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{teacher.jobTitle || 'Teacher'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(teacher)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendReminder.mutate({ teacherId: teacher.id, certificationType: 'all' })}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Remind
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium">Fingerprint</span>
                            </div>
                            {getStatusBadge(teacher.fingerprintExpiration)}
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-sm font-medium">CPR</span>
                            </div>
                            {getStatusBadge(teacher.cprExpiration)}
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-sm font-medium">First Aid</span>
                            </div>
                            {getStatusBadge(teacher.firstAidExpiration)}
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <Utensils className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="text-sm font-medium">Food Handler</span>
                            </div>
                            {getStatusBadge(teacher.foodHandlerExpiration)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Certifications Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Certifications</DialogTitle>
            <DialogDescription>
              Update certification expiration dates for {selectedTeacher?.firstName} {selectedTeacher?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fingerprint">Fingerprint Expiration</Label>
              <Input
                id="fingerprint"
                type="date"
                value={editingCertifications.fingerprintExpiration}
                onChange={(e) => setEditingCertifications(prev => ({
                  ...prev,
                  fingerprintExpiration: e.target.value
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpr">CPR Expiration</Label>
              <Input
                id="cpr"
                type="date"
                value={editingCertifications.cprExpiration}
                onChange={(e) => setEditingCertifications(prev => ({
                  ...prev,
                  cprExpiration: e.target.value
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstaid">First Aid Expiration</Label>
              <Input
                id="firstaid"
                type="date"
                value={editingCertifications.firstAidExpiration}
                onChange={(e) => setEditingCertifications(prev => ({
                  ...prev,
                  firstAidExpiration: e.target.value
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="foodhandler">Food Handler Expiration</Label>
              <Input
                id="foodhandler"
                type="date"
                value={editingCertifications.foodHandlerExpiration}
                onChange={(e) => setEditingCertifications(prev => ({
                  ...prev,
                  foodHandlerExpiration: e.target.value
                }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTeacher(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={updateCertifications.isPending}>
              {updateCertifications.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}