import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  TrendingUp
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

  const { data: eceData, isLoading, error } = useQuery<EceHoursData>({
    queryKey: ['/api/school/ece-hours-tracker'],
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
              <p className="text-gray-600 mt-1">Monitor employee ECE training compliance and renewal dates</p>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}