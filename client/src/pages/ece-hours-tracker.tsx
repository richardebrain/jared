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
  X as XIcon
} from 'lucide-react';
import { Link } from 'wouter';
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
  
  // State hooks
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEceData | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    reportingEmails: [''],
    frequency: 'monthly',
    isActive: true
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

  const sendTestReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/school/ece-test-report', {
        method: 'POST',
        data: {}
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Email Sent",
        description: `Test report sent to ${data.recipients?.length || 0} email(s)`,
      });
    },
    onError: (error: any) => {
      // Parse specific error types for better user guidance
      let errorMessage = "Failed to send test email";
      
      if (error.message?.includes("No ECE reporting settings found")) {
        errorMessage = "Please save your email settings first before sending a test report.";
      } else if (error.message?.includes("ECE reporting is disabled")) {
        errorMessage = "Email reports are disabled. Please enable them in settings.";
      } else if (error.message?.includes("No email recipients")) {
        errorMessage = "Please add at least one email address before sending test reports.";
      } else if (error.message?.includes("EMAIL_SEND_FAILED")) {
        errorMessage = "Email service temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message?.includes("check your email configuration")) {
        errorMessage = "Email configuration issue detected. Please contact support if this persists.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Test Email Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
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
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin</span>
            </Button>
          </Link>
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{employee.totalHours}/{employee.requiredHours} hours</span>
                          </div>
                          <Progress value={employee.progressPercentage} className="mt-1" />
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{employee.hoursRemaining}</p>
                          <p className="text-sm text-gray-600">Hours Remaining</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{employee.daysUntilRenewal}</p>
                          <p className="text-sm text-gray-600">Days Until Renewal</p>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}