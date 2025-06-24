import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  GraduationCap, 
  Edit, 
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Mail,
  Settings,
  Send,
  Plus,
  X as XIcon,
  FileText,
  Download,
  Award
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmployeeEceData {
  employeeId: number;
  employeeName: string;
  jobTitle: string;
  email: string;
  renewalDate: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  onlineHours: number;
  inPersonHours: number;
  requiredHours: number;
  progressPercentage: number;
  hoursRemaining: number;
  daysUntilRenewal: number;
  isCompliant: boolean;
  hoursByCategory: Record<string, number>;
  recentTrainings: Array<{
    title: string;
    category: string;
    hours: number;
    trainingType: string;
    location?: string;
    completedAt: string;
  }>;
}

interface SchoolStats {
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  complianceRate: number;
  averageHours: number;
}

interface EceHoursData {
  schoolStats: SchoolStats;
  employees: EmployeeEceData[];
}

export default function EceHoursTracker() {
  // All hooks must be called at the top level, in the same order every time
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // State hooks
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEceData | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    reportingEmails: [''],
    frequency: 'monthly',
    isActive: true
  });

  // Manual training form state
  const [showManualTrainingDialog, setShowManualTrainingDialog] = useState(false);
  const [showBulkTrainingDialog, setShowBulkTrainingDialog] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [generatingCertificateFor, setGeneratingCertificateFor] = useState<number | null>(null);
  const [manualTrainingForm, setManualTrainingForm] = useState({
    targetUserId: '',
    category: '',
    duration: '',
    trainingTitle: '',
    trainingLocation: '',
    notes: ''
  });

  // Query hooks
  const { data: eceData, isLoading, error } = useQuery<EceHoursData>({
    queryKey: ['/api/school/ece-hours-tracker'],
  });

  const { data: reportingSettings } = useQuery<{ settings: any; hasSettings: boolean }>({
    queryKey: ['/api/school/ece-reporting-settings'],
  });

  // Mutation hooks
  const updateEmailSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('/api/school/ece-reporting-settings', {
        method: 'POST',
        data: settings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school/ece-reporting-settings'] });
      toast({
        title: "Success",
        description: "Email notification settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive",
      });
    },
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      setGeneratingCertificateFor(employeeId);
      const response = await fetch('/api/ece-certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate certificate');
      }

      // Handle PDF download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename="')[1]?.split('"')[0] 
        : 'ECE_Certificate.pdf';

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename, employeeId };
    },
    onSuccess: (data: any) => {
      setGeneratingCertificateFor(null);
      toast({
        title: "Certificate Generated",
        description: `Professional development certificate downloaded successfully: ${data.filename}`,
      });
    },
    onError: (error: any) => {
      setGeneratingCertificateFor(null);
      toast({
        title: "Certificate Generation Failed",
        description: error.message || "Failed to generate professional development certificate",
        variant: "destructive",
      });
    },
  });

  const sendTestReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/school/ece-test-report', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Report Sent",
        description: "Test ECE report has been sent to your configured email addresses",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Test Report",
        description: error.message || "Failed to send test report",
        variant: "destructive"
      });
    }
  });

  const sendMonthlyReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/school/ece-monthly-report', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Monthly Report Sent",
        description: `Monthly ECE report sent to ${data.recipients?.length || 0} recipient(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Monthly Report",
        description: error.message || "Failed to send monthly report",
        variant: "destructive"
      });
    }
  });

  const updateRenewalDateMutation = useMutation({
    mutationFn: async ({ employeeId, renewalDate }: { employeeId: number; renewalDate: string }) => {
      return apiRequest(`/api/employee/${employeeId}/ece-renewal-date`, {
        method: 'PUT',
        data: { renewalDate }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school/ece-hours-tracker'] });
      toast({
        title: "Success",
        description: "ECE renewal date updated successfully",
      });
      setSelectedEmployee(null);
      setNewRenewalDate('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update renewal date",
        variant: "destructive",
      });
    },
  });

  // Manual training mutations
  const addManualTrainingMutation = useMutation({
    mutationFn: async (trainingData: any) => {
      return apiRequest('/api/ece-hours', {
        method: 'POST',
        data: {
          ...trainingData,
          trainingType: 'in_person'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Training Hours Added",
        description: "In-person training hours added successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/school/ece-hours-tracker'] });
      setShowManualTrainingDialog(false);
      setManualTrainingForm({
        targetUserId: '',
        category: '',
        duration: '',
        trainingTitle: '',
        trainingLocation: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Hours",
        description: error.message || "Failed to add training hours",
        variant: "destructive"
      });
    }
  });

  const addBulkTrainingMutation = useMutation({
    mutationFn: async (trainingData: any) => {
      return apiRequest('/api/ece-hours/bulk', {
        method: 'POST',
        data: {
          ...trainingData,
          trainingType: 'in_person'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Bulk Training Added",
        description: "In-person training hours added for all selected teachers!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/school/ece-hours-tracker'] });
      setShowBulkTrainingDialog(false);
      setSelectedUserIds([]);
      setManualTrainingForm({
        targetUserId: '',
        category: '',
        duration: '',
        trainingTitle: '',
        trainingLocation: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Bulk Hours",
        description: error.message || "Failed to add bulk training hours",
        variant: "destructive"
      });
    }
  });

  // Effect hooks
  useEffect(() => {
    if (reportingSettings?.settings) {
      setEmailSettings({
        reportingEmails: reportingSettings.settings.reportingEmails || [''],
        frequency: reportingSettings.settings.frequency || 'monthly',
        isActive: reportingSettings.settings.isActive ?? true
      });
    }
  }, [reportingSettings]);

  // Event handlers
  const handleSaveEmailSettings = () => {
    const validEmails = emailSettings.reportingEmails.filter(email => email.trim() !== '');
    updateEmailSettingsMutation.mutate({
      reportingEmails: validEmails,
      frequency: emailSettings.frequency,
      isActive: emailSettings.isActive
    });
  };

  const handleSendTestReport = () => {
    sendTestReportMutation.mutate();
  };

  const handleUpdateRenewalDate = () => {
    if (selectedEmployee && newRenewalDate) {
      updateRenewalDateMutation.mutate({
        employeeId: selectedEmployee.employeeId,
        renewalDate: newRenewalDate
      });
    }
  };

  const addEmailField = () => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: [...prev.reportingEmails, '']
    }));
  };

  const removeEmailField = (index: number) => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: prev.reportingEmails.filter((_, i) => i !== index)
    }));
  };

  const updateEmailField = (index: number, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: prev.reportingEmails.map((email, i) => i === index ? value : email)
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading ECE hours data. Please try again later.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setLocation('/director-toolkit')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Director Toolkit</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ECE Hours Tracker</h1>
            <p className="text-gray-600">Monitor early childhood education training compliance</p>
          </div>
        </div>
      </div>

      {/* School Statistics Overview */}
      {eceData?.schoolStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{eceData.schoolStats.totalEmployees}</p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{eceData.schoolStats.compliantEmployees}</p>
                  <p className="text-sm text-gray-600">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{eceData.schoolStats.nonCompliantEmployees}</p>
                  <p className="text-sm text-gray-600">Non-Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{Math.round(eceData.schoolStats.complianceRate)}%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">Employee Tracking</TabsTrigger>
          <TabsTrigger value="settings">Email Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          {/* Manual Training Entry Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add In-Person Training Hours</span>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={showManualTrainingDialog} onOpenChange={setShowManualTrainingDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Individual
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Individual Training Hours</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="targetUser">Select Teacher</Label>
                          <Select 
                            value={manualTrainingForm.targetUserId} 
                            onValueChange={(value) => setManualTrainingForm(prev => ({ ...prev, targetUserId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {eceData?.employees.map((employee) => (
                                <SelectItem key={employee.employeeId} value={employee.employeeId.toString()}>
                                  {employee.employeeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="trainingTitle">Training Title</Label>
                          <Input
                            id="trainingTitle"
                            value={manualTrainingForm.trainingTitle}
                            onChange={(e) => setManualTrainingForm(prev => ({ ...prev, trainingTitle: e.target.value }))}
                            placeholder="e.g., Child Development Workshop"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="category">ECE Category</Label>
                            <Select 
                              value={manualTrainingForm.category} 
                              onValueChange={(value) => setManualTrainingForm(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="social-emotional">Social-Emotional</SelectItem>
                                <SelectItem value="cognitive-development">Cognitive Development</SelectItem>
                                <SelectItem value="physical-development">Physical Development</SelectItem>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="adaptive">Adaptive Skills</SelectItem>
                                <SelectItem value="health-safety">Health & Safety</SelectItem>
                                <SelectItem value="family-engagement">Family Engagement</SelectItem>
                                <SelectItem value="professional-development">Professional Development</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="duration">Hours</Label>
                            <Input
                              id="duration"
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="8"
                              value={manualTrainingForm.duration}
                              onChange={(e) => setManualTrainingForm(prev => ({ ...prev, duration: e.target.value }))}
                              placeholder="2.0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="trainingLocation">Training Location</Label>
                          <Input
                            id="trainingLocation"
                            value={manualTrainingForm.trainingLocation}
                            onChange={(e) => setManualTrainingForm(prev => ({ ...prev, trainingLocation: e.target.value }))}
                            placeholder="e.g., Phoenix Convention Center"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Input
                            id="notes"
                            value={manualTrainingForm.notes}
                            onChange={(e) => setManualTrainingForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional details..."
                          />
                        </div>

                        <Button
                          onClick={() => {
                            if (!manualTrainingForm.targetUserId || !manualTrainingForm.trainingTitle || !manualTrainingForm.category || !manualTrainingForm.duration) {
                              toast({
                                title: "Missing Information",
                                description: "Please fill in all required fields",
                                variant: "destructive"
                              });
                              return;
                            }
                            addManualTrainingMutation.mutate({
                              targetUserId: parseInt(manualTrainingForm.targetUserId),
                              category: manualTrainingForm.category,
                              duration: Math.round(parseFloat(manualTrainingForm.duration) * 60), // Convert to minutes
                              trainingTitle: manualTrainingForm.trainingTitle,
                              trainingLocation: manualTrainingForm.trainingLocation,
                              notes: manualTrainingForm.notes
                            });
                          }}
                          disabled={addManualTrainingMutation.isPending}
                          className="w-full"
                        >
                          {addManualTrainingMutation.isPending ? "Adding..." : "Add Training Hours"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showBulkTrainingDialog} onOpenChange={setShowBulkTrainingDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Group Training Hours</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Teachers</Label>
                          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                            {eceData?.employees.map((employee) => (
                              <div key={employee.employeeId} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`user-${employee.employeeId}`}
                                  checked={selectedUserIds.includes(employee.employeeId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds(prev => [...prev, employee.employeeId]);
                                    } else {
                                      setSelectedUserIds(prev => prev.filter(id => id !== employee.employeeId));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={`user-${employee.employeeId}`} className="text-sm">
                                  {employee.employeeName}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="groupTrainingTitle">Training Title</Label>
                          <Input
                            id="groupTrainingTitle"
                            value={manualTrainingForm.trainingTitle}
                            onChange={(e) => setManualTrainingForm(prev => ({ ...prev, trainingTitle: e.target.value }))}
                            placeholder="e.g., Annual ECE Conference"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="groupCategory">ECE Category</Label>
                            <Select 
                              value={manualTrainingForm.category} 
                              onValueChange={(value) => setManualTrainingForm(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="social-emotional">Social-Emotional</SelectItem>
                                <SelectItem value="cognitive-development">Cognitive Development</SelectItem>
                                <SelectItem value="physical-development">Physical Development</SelectItem>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="adaptive">Adaptive Skills</SelectItem>
                                <SelectItem value="health-safety">Health & Safety</SelectItem>
                                <SelectItem value="family-engagement">Family Engagement</SelectItem>
                                <SelectItem value="professional-development">Professional Development</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="groupDuration">Hours</Label>
                            <Input
                              id="groupDuration"
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="8"
                              value={manualTrainingForm.duration}
                              onChange={(e) => setManualTrainingForm(prev => ({ ...prev, duration: e.target.value }))}
                              placeholder="6.0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="groupLocation">Training Location</Label>
                          <Input
                            id="groupLocation"
                            value={manualTrainingForm.trainingLocation}
                            onChange={(e) => setManualTrainingForm(prev => ({ ...prev, trainingLocation: e.target.value }))}
                            placeholder="e.g., Phoenix Convention Center"
                          />
                        </div>

                        <Button
                          onClick={() => {
                            if (selectedUserIds.length === 0 || !manualTrainingForm.trainingTitle || !manualTrainingForm.category || !manualTrainingForm.duration) {
                              toast({
                                title: "Missing Information",
                                description: "Please select teachers and fill in all required fields",
                                variant: "destructive"
                              });
                              return;
                            }
                            addBulkTrainingMutation.mutate({
                              userIds: selectedUserIds,
                              category: manualTrainingForm.category,
                              duration: Math.round(parseFloat(manualTrainingForm.duration) * 60), // Convert to minutes
                              trainingTitle: manualTrainingForm.trainingTitle,
                              trainingLocation: manualTrainingForm.trainingLocation,
                              notes: manualTrainingForm.notes
                            });
                          }}
                          disabled={addBulkTrainingMutation.isPending}
                          className="w-full"
                        >
                          {addBulkTrainingMutation.isPending ? "Adding..." : `Add Hours for ${selectedUserIds.length} Teachers`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Employee ECE Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eceData?.employees && eceData.employees.length > 0 ? (
                <div className="space-y-4">
                  {eceData.employees.map((employee) => (
                    <div key={employee.employeeId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{employee.employeeName}</h3>
                          <p className="text-sm text-gray-600">{employee.jobTitle} • {employee.email}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={employee.isCompliant ? "default" : "destructive"}>
                            {employee.isCompliant ? "Compliant" : "Non-Compliant"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateCertificateMutation.mutate(employee.employeeId)}
                            disabled={generatingCertificateFor === employee.employeeId}
                            className="flex items-center space-x-1"
                          >
                            {generatingCertificateFor === employee.employeeId ? (
                              <>
                                <Download className="h-4 w-4 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Award className="h-4 w-4" />
                                <span>Certificate</span>
                              </>
                            )}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setNewRenewalDate(employee.renewalDate);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update ECE Renewal Date</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="renewalDate">New Renewal Date</Label>
                                  <Input
                                    id="renewalDate"
                                    type="date"
                                    value={newRenewalDate}
                                    onChange={(e) => setNewRenewalDate(e.target.value)}
                                  />
                                </div>
                                <Button
                                  onClick={handleUpdateRenewalDate}
                                  disabled={updateRenewalDateMutation.isPending}
                                  className="w-full"
                                >
                                  {updateRenewalDateMutation.isPending ? "Updating..." : "Update Renewal Date"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Total Progress</span>
                            <span>{employee.totalHours}/{employee.requiredHours} hours</span>
                          </div>
                          <Progress value={employee.progressPercentage} className="mt-1" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{employee.onlineHours}</p>
                          <p className="text-xs text-gray-600">Online Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-600">{employee.inPersonHours}</p>
                          <p className="text-xs text-gray-600">In-Person Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">{employee.daysUntilRenewal}</p>
                          <p className="text-xs text-gray-600">Days Until Renewal</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Period: {new Date(employee.periodStart).toLocaleDateString()} - {new Date(employee.periodEnd).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Renewal: {new Date(employee.renewalDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No employee data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Monthly Email Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-active">Enable Email Reports</Label>
                  <p className="text-sm text-gray-600">Send monthly ECE hours reports automatically</p>
                </div>
                <Switch
                  id="email-active"
                  checked={emailSettings.isActive}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>Report Recipients</Label>
                {emailSettings.reportingEmails.map((email, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => updateEmailField(index, e.target.value)}
                      className="flex-1"
                    />
                    {emailSettings.reportingEmails.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmailField(index)}
                        className="px-3"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEmailField}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Email</span>
                </Button>
              </div>

              <div className="space-y-3">
                <Label htmlFor="frequency">Report Frequency</Label>
                <Select
                  value={emailSettings.frequency}
                  onValueChange={(value) => 
                    setEmailSettings(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleSaveEmailSettings}
                  disabled={updateEmailSettingsMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{updateEmailSettingsMutation.isPending ? "Saving..." : "Save Settings"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendTestReport}
                  disabled={sendTestReportMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sendTestReportMutation.isPending ? "Sending..." : "Send Test Report"}</span>
                </Button>
                <Button
                  variant="default"
                  onClick={() => sendMonthlyReportMutation.mutate()}
                  disabled={sendMonthlyReportMutation.isPending}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Mail className="h-4 w-4" />
                  <span>{sendMonthlyReportMutation.isPending ? "Sending..." : "Send Monthly Report"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}