import React, { useState } from 'react';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEceData | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    reportingEmails: [''],
    frequency: 'monthly',
    isActive: true
  });

  const { data: eceData, isLoading, error } = useQuery<EceHoursData>({
    queryKey: ['/api/school/ece-hours-tracker'],
  });

  // Email settings queries and mutations
  const { data: reportingSettings } = useQuery<{ settings: any; hasSettings: boolean }>({
    queryKey: ['/api/school/ece-reporting-settings'],
  });

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
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
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

  const handleUpdateRenewalDate = () => {
    if (selectedEmployee && newRenewalDate) {
      updateRenewalDateMutation.mutate({
        employeeId: selectedEmployee.employeeId,
        renewalDate: newRenewalDate
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !eceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading ECE Hours Data</h3>
                <p className="text-red-600">Unable to load ECE hours tracking data. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { schoolStats, employees } = eceData;

  // Initialize email settings from API data
  React.useEffect(() => {
    if (reportingSettings?.settings) {
      setEmailSettings({
        reportingEmails: reportingSettings.settings.reportingEmails || [''],
        frequency: reportingSettings.settings.frequency || 'monthly',
        isActive: reportingSettings.settings.isActive !== false
      });
    }
  }, [reportingSettings]);

  const handleAddEmailField = () => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: [...prev.reportingEmails, '']
    }));
  };

  const handleRemoveEmailField = (index: number) => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: prev.reportingEmails.filter((_, i) => i !== index)
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      reportingEmails: prev.reportingEmails.map((email, i) => i === index ? value : email)
    }));
  };

  const handleSaveEmailSettings = () => {
    const validEmails = emailSettings.reportingEmails.filter(email => email.trim());
    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }

    updateEmailSettingsMutation.mutate({
      ...emailSettings,
      reportingEmails: validEmails
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/director-toolkit">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Toolkit
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-8 w-8 text-blue-600" />
                ECE Hour Tracker
              </h1>
              <p className="text-gray-600 mt-1">Monitor employee ECE training compliance and email reporting</p>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="hours" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hour Tracking
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="space-y-6 mt-6">
            {/* School-Wide Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold">{schoolStats.totalEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Compliant</p>
                      <p className="text-2xl font-bold text-green-600">{schoolStats.compliantEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Non-Compliant</p>
                      <p className="text-2xl font-bold text-orange-600">{schoolStats.nonCompliantEmployees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Compliance Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{schoolStats.complianceRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Average Hours</p>
                      <p className="text-2xl font-bold text-indigo-600">{schoolStats.averageHours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employee ECE Hours Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Employee ECE Hours Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.employeeId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Employee Info */}
                        <div className="lg:col-span-3">
                          <h3 className="font-semibold text-gray-900">{employee.employeeName}</h3>
                          <p className="text-sm text-gray-600">{employee.jobTitle}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>

                        {/* Hours Progress */}
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              {employee.totalHours} / {employee.requiredHours} hours
                            </span>
                            {employee.isCompliant ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <Progress 
                            value={employee.progressPercentage} 
                            className="w-full h-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {employee.progressPercentage}% complete
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="lg:col-span-2">
                          <Badge 
                            variant={employee.isCompliant ? "default" : "destructive"}
                            className="w-full justify-center"
                          >
                            {employee.isCompliant ? "Compliant" : `${employee.hoursRemaining.toFixed(1)}h needed`}
                          </Badge>
                        </div>

                        {/* Renewal Date */}
                        <div className="lg:col-span-2">
                          <div className="text-center">
                            <p className="text-sm font-medium">Renewal Date</p>
                            <p className="text-xs text-gray-600">{employee.renewalDate}</p>
                            <p className="text-xs text-gray-500">
                              {employee.daysUntilRenewal} days left
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                              setNewRenewalDate(employee.renewalDate);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Date
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update ECE Renewal Date</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Employee</Label>
                              <p className="text-sm text-gray-600">{selectedEmployee?.employeeName}</p>
                            </div>
                            <div>
                              <Label htmlFor="renewalDate">New Renewal Date</Label>
                              <Input
                                id="renewalDate"
                                type="date"
                                value={newRenewalDate}
                                onChange={(e) => setNewRenewalDate(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedEmployee(null);
                                  setNewRenewalDate('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateRenewalDate}
                                disabled={updateRenewalDateMutation.isPending}
                              >
                                {updateRenewalDateMutation.isPending ? 'Updating...' : 'Update Date'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Recent Training Summary */}
                  {employee.recentTrainings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Recent Training:</p>
                      <div className="flex flex-wrap gap-2">
                        {employee.recentTrainings.slice(0, 2).map((training, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {training.title} ({training.hours}h)
                          </Badge>
                        ))}
                        {employee.recentTrainings.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{employee.recentTrainings.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">ECE Hours Requirements</h3>
                <p className="text-sm text-blue-800">
                  All early childhood educators are required to complete 30 hours of professional development training annually. 
                  Renewal dates default to the employee's first login date but can be customized for employees who started before this system was implemented.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-6">
            {/* Email Settings Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Email Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Frequency */}
                <div>
                  <Label htmlFor="frequency">Report Frequency</Label>
                  <Select 
                    value={emailSettings.frequency} 
                    onValueChange={(value) => setEmailSettings(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly (1st of each month)</SelectItem>
                      <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                      <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Recipients */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Email Recipients</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddEmailField}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Email
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {emailSettings.reportingEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {emailSettings.reportingEmails.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveEmailField(index)}
                            className="p-2"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enable/Disable Notifications */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Email Notifications</h4>
                    <p className="text-sm text-gray-600">Automatically send ECE training reports to specified recipients</p>
                  </div>
                  <Switch
                    checked={emailSettings.isActive}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                {/* Save Settings */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => sendTestReportMutation.mutate()}
                    disabled={sendTestReportMutation.isPending || !emailSettings.isActive}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendTestReportMutation.isPending ? 'Sending...' : 'Send Test Report'}
                  </Button>
                  <Button
                    onClick={handleSaveEmailSettings}
                    disabled={updateEmailSettingsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {updateEmailSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Monthly Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">ECE Training Hours Report - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">School Statistics:</p>
                        <ul className="text-gray-600 ml-4">
                          <li>• Total Employees: {schoolStats.totalEmployees}</li>
                          <li>• Compliant: {schoolStats.compliantEmployees}</li>
                          <li>• Non-Compliant: {schoolStats.nonCompliantEmployees}</li>
                          <li>• Compliance Rate: {schoolStats.complianceRate}%</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Training Categories:</p>
                        <ul className="text-gray-600 ml-4">
                          <li>• Child Development</li>
                          <li>• Classroom Management</li>
                          <li>• Health & Safety</li>
                          <li>• Family Engagement</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        This automated report includes detailed training summaries, compliance status for each employee, 
                        and recommendations for meeting ECE requirements. Reports are sent on the {emailSettings.frequency === 'monthly' ? '1st of each month' : emailSettings.frequency === 'weekly' ? 'first Monday of each week' : 'first day of each quarter'}.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}